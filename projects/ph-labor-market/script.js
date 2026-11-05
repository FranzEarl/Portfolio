const API_BASE = "https://api.worldbank.org/v2/country/PH/indicator";
const SVG_NS = "http://www.w3.org/2000/svg";
const COLORS = ["#62a5f3", "#f0a35e", "#81c995"];
const INDICATORS = [
    {
        id: "SL.UEM.TOTL.ZS",
        label: "Unemployment rate",
        chartLabel: "Total unemployment",
        group: "unemployment"
    },
    {
        id: "SL.UEM.1524.ZS",
        label: "Youth unemployment rate",
        chartLabel: "Youth unemployment",
        group: "unemployment"
    },
    {
        id: "SL.TLF.CACT.ZS",
        label: "Labor-force participation",
        chartLabel: "Labor-force participation",
        group: "participation"
    },
    {
        id: "SL.EMP.TOTL.SP.ZS",
        label: "Employment-to-population ratio",
        chartLabel: "Employment-to-population",
        group: "participation"
    },
    {
        id: "SL.AGR.EMPL.ZS",
        label: "Agriculture employment",
        chartLabel: "Agriculture",
        group: "sector"
    },
    {
        id: "SL.IND.EMPL.ZS",
        label: "Industry employment",
        chartLabel: "Industry",
        group: "sector"
    },
    {
        id: "SL.SRV.EMPL.ZS",
        label: "Services employment",
        chartLabel: "Services",
        group: "sector"
    }
];
const CSV_COLUMNS = [
    ["SL.UEM.TOTL.ZS", "unemployment_rate"],
    ["SL.UEM.1524.ZS", "youth_unemployment_rate"],
    ["SL.TLF.CACT.ZS", "labor_force_participation"],
    ["SL.EMP.TOTL.SP.ZS", "employment_to_population"],
    ["SL.AGR.EMPL.ZS", "agriculture_employment"],
    ["SL.IND.EMPL.ZS", "industry_employment"],
    ["SL.SRV.EMPL.ZS", "services_employment"]
];
let loadedSeries = null;

function parseIndicatorPayload(payload, indicator) {
    if (!Array.isArray(payload) || !payload[0] || !Array.isArray(payload[1])) {
        throw new Error(`The World Bank returned an invalid response for ${indicator.label}.`);
    }

    const observations = payload[1]
        .filter((row) =>
            row
            && /^\d{4}$/.test(String(row.date))
            && row.value !== null
            && Number.isFinite(Number(row.value))
        )
        .map((row) => ({ year: Number(row.date), value: Number(row.value) }))
        .sort((left, right) => left.year - right.year);

    if (observations.length === 0) {
        throw new Error(`No observations are available for ${indicator.label}.`);
    }

    return {
        ...indicator,
        observations,
        lastUpdated: payload[0].lastupdated || ""
    };
}

function findObservation(indicator, year) {
    return indicator.observations.find((observation) => observation.year === year);
}

function splitObservationGaps(observations) {
    const segments = [];
    let segment = [];

    observations.forEach((observation, index) => {
        if (index > 0 && observation.year !== observations[index - 1].year + 1) {
            segments.push(segment);
            segment = [];
        }
        segment.push(observation);
    });

    if (segment.length > 0) segments.push(segment);
    return segments;
}

function buildCaseStudyInsights(series) {
    const agriculture = series.find((item) => item.id === "SL.AGR.EMPL.ZS");
    const industry = series.find((item) => item.id === "SL.IND.EMPL.ZS");
    const services = series.find((item) => item.id === "SL.SRV.EMPL.ZS");
    const youth = series.find((item) => item.id === "SL.UEM.1524.ZS");
    if (!agriculture || !industry || !services || !youth) {
        throw new Error("The source response is missing an indicator needed for the case study.");
    }

    const commonYears = agriculture.observations
        .map((observation) => observation.year)
        .filter((year) =>
            findObservation(industry, year)
            && findObservation(services, year)
        )
        .sort((left, right) => left - right);
    if (commonYears.length < 2) {
        throw new Error("Not enough overlapping sector observations to calculate the case study.");
    }

    const startYear = commonYears[0];
    const endYear = commonYears[commonYears.length - 1];
    const sectorStart = {
        agriculture: findObservation(agriculture, startYear).value,
        industry: findObservation(industry, startYear).value,
        services: findObservation(services, startYear).value
    };
    const sectorEnd = {
        agriculture: findObservation(agriculture, endYear).value,
        industry: findObservation(industry, endYear).value,
        services: findObservation(services, endYear).value
    };
    const youthStart = findObservation(youth, 2020);
    const youthRecent = youth.observations.filter((observation) => observation.year >= 2020);
    if (!youthStart || youthRecent.length === 0) {
        throw new Error("Not enough youth unemployment observations since 2020 to calculate the case study.");
    }

    const youthPeak = youthRecent.reduce((peak, observation) =>
        observation.value > peak.value ? observation : peak
    );
    const youthLatest = youthRecent[youthRecent.length - 1];

    return {
        sector: {
            startYear,
            endYear,
            start: sectorStart,
            end: sectorEnd,
            change: {
                agriculture: sectorEnd.agriculture - sectorStart.agriculture,
                industry: sectorEnd.industry - sectorStart.industry,
                services: sectorEnd.services - sectorStart.services
            }
        },
        youth: {
            start: youthStart,
            peak: youthPeak,
            latest: youthLatest,
            changeFromStart: youthLatest.value - youthStart.value,
            changeFromPeak: youthLatest.value - youthPeak.value
        }
    };
}

function buildAnalysisCsv(series) {
    const observationMaps = new Map(CSV_COLUMNS.map(([id, column]) => {
        const indicator = series.find((item) => item.id === id);
        if (!indicator) {
            throw new Error(`The source response is missing ${column}.`);
        }
        return [column, new Map(indicator.observations.map((observation) => [
            observation.year,
            observation.value
        ]))];
    }));
    const years = [...new Set([...observationMaps.values()].flatMap((observations) =>
        [...observations.keys()]
    ))].sort((left, right) => left - right);
    const headers = ["year", ...CSV_COLUMNS.map(([, column]) => column)];
    const rows = years.map((year) => [
        year,
        ...CSV_COLUMNS.map(([, column]) => observationMaps.get(column).get(year) ?? "")
    ]);
    return [headers, ...rows]
        .map((row) => row.map((value) => {
            const text = String(value);
            return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
        }).join(","))
        .join("\r\n");
}

function createSvgElement(tag, attributes = {}) {
    const element = document.createElementNS(SVG_NS, tag);
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
    return element;
}

function appendSvgText(svg, text, attributes = {}) {
    const element = createSvgElement("text", attributes);
    element.textContent = text;
    svg.append(element);
}

function renderChart(container, series) {
    const width = 720;
    const height = 270;
    const margin = { top: 12, right: 12, bottom: 38, left: 48 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const years = [...new Set(series.flatMap((item) => item.observations.map((point) => point.year)))].sort();
    const values = series.flatMap((item) => item.observations.map((point) => point.value));
    const minValue = Math.min(0, ...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;
    const yMin = minValue === 0 ? 0 : Math.max(0, minValue - range * 0.12);
    const yMax = maxValue + range * 0.12;
    const yRange = yMax - yMin || 1;
    const x = (year) => margin.left + ((year - years[0]) / (years[years.length - 1] - years[0] || 1)) * plotWidth;
    const y = (value) => margin.top + ((yMax - value) / yRange) * plotHeight;
    const tableId = `${container.id}-data`;
    const svg = createSvgElement("svg", {
        viewBox: `0 0 ${width} ${height}`,
        role: "img",
        "aria-label": series.map((item) => item.chartLabel).join(", "),
        "aria-describedby": tableId
    });

    const title = createSvgElement("title");
    title.textContent = `${series.map((item) => item.chartLabel).join(" and ")} over time`;
    svg.append(title);
    const description = createSvgElement("desc");
    description.textContent = `Annual percentage estimates from ${years[0]} to ${years[years.length - 1]}.`;
    svg.append(description);

    for (let tick = 0; tick <= 4; tick += 1) {
        const tickValue = yMin + (yRange * tick) / 4;
        const position = y(tickValue);
        svg.append(createSvgElement("line", {
            x1: margin.left,
            x2: width - margin.right,
            y1: position,
            y2: position,
            class: "labor-chart-gridline"
        }));
        appendSvgText(svg, `${tickValue.toFixed(0)}%`, {
            x: margin.left - 8,
            y: position + 4,
            "text-anchor": "end",
            class: "labor-chart-axis-label"
        });
    }

    const labelYears = years.filter((year, index) =>
        index === 0 || index === years.length - 1 || year % 5 === 0
    );
    labelYears.forEach((year) => {
        appendSvgText(svg, String(year), {
            x: x(year),
            y: height - 12,
            "text-anchor": "middle",
            class: "labor-chart-axis-label"
        });
    });

    series.forEach((item, index) => {
        const color = COLORS[index % COLORS.length];
        const segments = splitObservationGaps(item.observations);
        segments.forEach((segment) => {
            if (segment.length > 1) {
                const points = segment.map((point) => `${x(point.year)},${y(point.value)}`);
                svg.append(createSvgElement("polyline", {
                    points: points.join(" "),
                    class: "labor-chart-line",
                    stroke: color
                }));
            } else {
                const [point] = segment;
                svg.append(createSvgElement("circle", {
                    cx: x(point.year),
                    cy: y(point.value),
                    r: 2.5,
                    fill: color,
                    class: "labor-chart-dot"
                }));
            }
        });

        const latest = item.observations[item.observations.length - 1];
        const dot = createSvgElement("circle", {
            cx: x(latest.year),
            cy: y(latest.value),
            r: 4,
            fill: color,
            class: "labor-chart-dot"
        });
        const dotTitle = createSvgElement("title");
        dotTitle.textContent = `${item.chartLabel}: ${latest.value.toFixed(1)}% in ${latest.year}`;
        dot.append(dotTitle);
        svg.append(dot);
    });

    const legend = document.createElement("ul");
    legend.className = "labor-legend";
    series.forEach((item, index) => {
        const entry = document.createElement("li");
        const swatch = document.createElement("span");
        swatch.className = "labor-legend-swatch";
        swatch.style.backgroundColor = COLORS[index % COLORS.length];
        const label = document.createElement("span");
        label.textContent = item.chartLabel;
        entry.append(swatch, label);
        legend.append(entry);
    });
    const dataTable = document.createElement("table");
    dataTable.id = tableId;
    dataTable.className = "labor-chart-data";
    const caption = document.createElement("caption");
    caption.textContent = `Annual data for ${series.map((item) => item.chartLabel).join(", ")}`;
    dataTable.append(caption);
    const head = document.createElement("thead");
    const headerRow = document.createElement("tr");
    ["Year", ...series.map((item) => item.chartLabel)].forEach((label) => {
        const cell = document.createElement("th");
        cell.scope = "col";
        cell.textContent = label;
        headerRow.append(cell);
    });
    head.append(headerRow);
    dataTable.append(head);
    const body = document.createElement("tbody");
    years.forEach((year) => {
        const row = document.createElement("tr");
        const yearCell = document.createElement("th");
        yearCell.scope = "row";
        yearCell.textContent = String(year);
        row.append(yearCell);
        series.forEach((item) => {
            const cell = document.createElement("td");
            const observation = findObservation(item, year);
            cell.textContent = observation ? `${observation.value.toFixed(1)}%` : "No data";
            row.append(cell);
        });
        body.append(row);
    });
    dataTable.append(body);
    container.replaceChildren(svg, legend, dataTable);
}

function renderMetrics(series) {
    const metrics = document.querySelector("#labor-metrics");
    const cards = series
        .filter((indicator) => indicator.group !== "sector")
        .map((indicator) => {
            const latest = indicator.observations[indicator.observations.length - 1];
            const card = document.createElement("article");
            card.className = "labor-metric";
            const label = document.createElement("span");
            label.className = "labor-metric-label";
            label.textContent = indicator.label;
            const value = document.createElement("strong");
            value.className = "labor-metric-value";
            value.textContent = `${latest.value.toFixed(1)}%`;
            const year = document.createElement("span");
            year.className = "labor-metric-year";
            year.textContent = `Latest: ${latest.year}`;
            card.append(label, value, year);
            return card;
        });
    metrics.replaceChildren(...cards);
}

function renderCaseStudy(series) {
    const insights = buildCaseStudyInsights(series);
    const container = document.querySelector("#labor-findings");
    const sector = document.createElement("article");
    sector.className = "labor-finding-card";
    const sectorLabel = document.createElement("p");
    sectorLabel.className = "labor-eyebrow";
    sectorLabel.textContent = `${insights.sector.startYear}–${insights.sector.endYear} / EMPLOYMENT SHARES`;
    const sectorTitle = document.createElement("h3");
    sectorTitle.textContent = "Work shifted away from agriculture";
    const sectorText = document.createElement("p");
    const agricultureChange = Math.abs(insights.sector.change.agriculture).toFixed(1);
    const servicesChange = Math.abs(insights.sector.change.services).toFixed(1);
    const agricultureDirection = insights.sector.change.agriculture <= 0 ? "fell" : "rose";
    const servicesDirection = insights.sector.change.services >= 0 ? "rose" : "fell";
    sectorText.textContent = `Agriculture ${agricultureDirection} from ${insights.sector.start.agriculture.toFixed(1)}% to ${insights.sector.end.agriculture.toFixed(1)}% (${agricultureChange} percentage points), while services ${servicesDirection} from ${insights.sector.start.services.toFixed(1)}% to ${insights.sector.end.services.toFixed(1)}% (${servicesChange} points). Industry changed by ${insights.sector.change.industry > 0 ? "+" : ""}${insights.sector.change.industry.toFixed(1)} points.`;
    sector.append(sectorLabel, sectorTitle, sectorText);

    const youth = document.createElement("article");
    youth.className = "labor-finding-card";
    const youthLabel = document.createElement("p");
    youthLabel.className = "labor-eyebrow";
    youthLabel.textContent = `${insights.youth.start.year}–${insights.youth.latest.year} / AGES 15–24`;
    const youthTitle = document.createElement("h3");
    youthTitle.textContent = "Youth unemployment eased from its recent high";
    const youthText = document.createElement("p");
    const peakDifference = Math.abs(insights.youth.changeFromPeak).toFixed(1);
    const peakDirection = insights.youth.changeFromPeak <= 0 ? "below" : "above";
    const baselineDifference = Math.abs(insights.youth.changeFromStart).toFixed(1);
    const baselineDirection = insights.youth.changeFromStart >= 0 ? "above" : "below";
    youthText.textContent = `The rate peaked at ${insights.youth.peak.value.toFixed(1)}% in ${insights.youth.peak.year}, then reached ${insights.youth.latest.value.toFixed(1)}% in ${insights.youth.latest.year} (${peakDifference} points ${peakDirection} the peak). That is ${baselineDifference} points ${baselineDirection} its ${insights.youth.start.year} level.`;
    youth.append(youthLabel, youthTitle, youthText);
    container.replaceChildren(sector, youth);
}

function downloadCsv(series) {
    const csv = buildAnalysisCsv(series);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "philippines-labor-market-world-bank.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function loadData() {
    const status = document.querySelector("#labor-data-status");
    const refresh = document.querySelector("#refresh-data");
    const download = document.querySelector("#download-data");
    const sourceUpdated = document.querySelector("#labor-source-updated");
    const hasLoadedData = Boolean(loadedSeries);
    refresh.disabled = true;
    download.disabled = true;
    status.dataset.error = "false";
    status.textContent = "Loading public World Bank statistics…";

    try {
        const series = await Promise.all(INDICATORS.map(async (indicator) => {
            const response = await fetch(
                `${API_BASE}/${indicator.id}?format=json&per_page=1000`,
                { headers: { Accept: "application/json" } }
            );
            if (!response.ok) {
                throw new Error(`World Bank request failed (${response.status}) for ${indicator.label}.`);
            }
            return parseIndicatorPayload(await response.json(), indicator);
        }));

        renderMetrics(series);
        renderCaseStudy(series);
        renderChart(document.querySelector("#unemployment-chart"), series.filter((item) => item.group === "unemployment"));
        renderChart(document.querySelector("#participation-chart"), series.filter((item) => item.group === "participation"));
        renderChart(document.querySelector("#sector-chart"), series.filter((item) => item.group === "sector"));
        loadedSeries = series;

        const latestYear = Math.max(...series.map((item) => item.observations[item.observations.length - 1].year));
        const updateDates = series.map((item) => item.lastUpdated).filter(Boolean).sort();
        const updated = updateDates[updateDates.length - 1] || "not provided";
        status.textContent = `Loaded ${series.length} indicators. Latest available observations: ${latestYear}.`;
        sourceUpdated.textContent = `World Bank data last updated: ${updated}.`;
        download.disabled = false;
    } catch (error) {
        status.dataset.error = "true";
        const detail = error instanceof Error ? error.message : String(error);
        status.textContent = hasLoadedData
            ? `Refresh failed; showing the previously loaded data. ${detail} Check your connection and try again.`
            : `Could not load the labor statistics. ${detail} Check your connection and try again.`;
    } finally {
        refresh.disabled = false;
        download.disabled = !loadedSeries;
    }
}

if (typeof document !== "undefined") {
    document.querySelector("#refresh-data").addEventListener("click", loadData);
    document.querySelector("#download-data").addEventListener("click", () => {
        if (loadedSeries) downloadCsv(loadedSeries);
    });
    loadData();
}
