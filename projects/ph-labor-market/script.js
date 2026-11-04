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
    const svg = createSvgElement("svg", {
        viewBox: `0 0 ${width} ${height}`,
        role: "img",
        "aria-label": series.map((item) => item.chartLabel).join(", ")
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
        const points = item.observations.map((point) => `${x(point.year)},${y(point.value)}`);
        const path = createSvgElement("polyline", {
            points: points.join(" "),
            class: "labor-chart-line",
            stroke: color
        });
        svg.append(path);

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
    container.replaceChildren(svg, legend);
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

async function loadData() {
    const status = document.querySelector("#labor-data-status");
    const refresh = document.querySelector("#refresh-data");
    const sourceUpdated = document.querySelector("#labor-source-updated");
    refresh.disabled = true;
    status.dataset.error = "false";
    status.textContent = "Loading public World Bank statistics…";
    sourceUpdated.textContent = "";

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
        renderChart(document.querySelector("#unemployment-chart"), series.filter((item) => item.group === "unemployment"));
        renderChart(document.querySelector("#participation-chart"), series.filter((item) => item.group === "participation"));
        renderChart(document.querySelector("#sector-chart"), series.filter((item) => item.group === "sector"));

        const latestYear = Math.max(...series.map((item) => item.observations[item.observations.length - 1].year));
        const updateDates = series.map((item) => item.lastUpdated).filter(Boolean).sort();
        const updated = updateDates[updateDates.length - 1] || "not provided";
        status.textContent = `Loaded ${series.length} indicators. Latest available observations: ${latestYear}.`;
        sourceUpdated.textContent = `World Bank data last updated: ${updated}.`;
    } catch (error) {
        status.dataset.error = "true";
        status.textContent = `Could not load the labor statistics. ${error.message} Check your connection and try again.`;
    } finally {
        refresh.disabled = false;
    }
}

if (typeof document !== "undefined") {
    document.querySelector("#refresh-data").addEventListener("click", loadData);
    loadData();
}
