const courses = [
    { name: "Data Structures", grade: 91, attendance: 96, studyHours: 10 },
    { name: "Statistics", grade: 87, attendance: 93, studyHours: 12 },
    { name: "Database Systems", grade: 84, attendance: 92, studyHours: 11 },
    { name: "Web Development", grade: 89, attendance: 97, studyHours: 13 },
    { name: "Calculus", grade: 78, attendance: 86, studyHours: 14 },
    { name: "Communication", grade: 93, attendance: 98, studyHours: 6 }
];

const weeklyStudy = [
    { label: "Week 1", hours: 15 },
    { label: "Week 2", hours: 18 },
    { label: "Week 3", hours: 14 },
    { label: "Week 4", hours: 19 }
];

const elements = {
    averageGrade: document.querySelector("#average-grade"),
    studyHours: document.querySelector("#study-hours"),
    attendanceRate: document.querySelector("#attendance-rate"),
    coursesOnTrack: document.querySelector("#courses-on-track"),
    courseChart: document.querySelector("#course-chart"),
    weeklyChart: document.querySelector("#weekly-chart"),
    courseRows: document.querySelector("#course-rows"),
    courseCount: document.querySelector("#course-count")
};

function formatNumber(value, maximumFractionDigits = 0) {
    return new Intl.NumberFormat("en", { maximumFractionDigits }).format(value);
}

function renderSummary() {
    const averageGrade = courses.reduce((total, course) => total + course.grade, 0) / courses.length;
    const attendanceRate = courses.reduce((total, course) => total + course.attendance, 0) / courses.length;
    const studyHours = weeklyStudy.reduce((total, week) => total + week.hours, 0);
    const coursesOnTrack = courses.filter((course) => course.grade >= 80).length;

    elements.averageGrade.textContent = `${formatNumber(averageGrade, 1)}%`;
    elements.studyHours.textContent = `${formatNumber(studyHours)} hrs`;
    elements.attendanceRate.textContent = `${formatNumber(attendanceRate, 1)}%`;
    elements.coursesOnTrack.textContent = `${coursesOnTrack} / ${courses.length}`;
}

function renderCourseChart() {
    const rows = courses.map((course) => {
        const row = document.createElement("div");
        row.className = "course-chart-row";

        const labels = document.createElement("div");
        labels.className = "course-chart-labels";

        const name = document.createElement("span");
        name.textContent = course.name;

        const grade = document.createElement("span");
        grade.textContent = `${course.grade}%`;

        const track = document.createElement("div");
        track.className = "progress-track";
        track.setAttribute("role", "progressbar");
        track.setAttribute("aria-label", `${course.name} grade`);
        track.setAttribute("aria-valuemin", "0");
        track.setAttribute("aria-valuemax", "100");
        track.setAttribute("aria-valuenow", String(course.grade));

        const bar = document.createElement("div");
        bar.className = "progress-bar";
        bar.style.width = `${course.grade}%`;

        labels.append(name, grade);
        track.append(bar);
        row.append(labels, track);
        return row;
    });

    elements.courseChart.replaceChildren(...rows);
}

function renderWeeklyChart() {
    const maximumHours = Math.max(...weeklyStudy.map((week) => week.hours));
    const columns = weeklyStudy.map((week) => {
        const column = document.createElement("div");
        column.className = "week-column";
        column.setAttribute("aria-label", `${week.label}: ${week.hours} study hours`);

        const area = document.createElement("div");
        area.className = "week-bar-area";
        area.setAttribute("aria-hidden", "true");

        const bar = document.createElement("div");
        bar.className = "week-bar";
        bar.style.height = `${(week.hours / maximumHours) * 100}%`;
        area.append(bar);

        const label = document.createElement("div");
        label.className = "week-label";
        label.textContent = week.label;

        const hours = document.createElement("span");
        hours.className = "week-hours";
        hours.textContent = `${week.hours} hrs`;
        label.append(hours);

        column.append(area, label);
        return column;
    });

    elements.weeklyChart.replaceChildren(...columns);
}

function renderCourseTable() {
    const rows = courses.map((course) => {
        const row = document.createElement("tr");
        const values = [
            course.name,
            `${course.grade}%`,
            `${course.attendance}%`,
            `${formatNumber(course.studyHours)} hrs`
        ];

        values.forEach((value) => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.append(cell);
        });

        const statusCell = document.createElement("td");
        const status = document.createElement("span");
        const onTrack = course.grade >= 80;
        status.className = onTrack ? "course-status" : "course-status needs-focus";
        status.textContent = onTrack ? "On track" : "Needs focus";
        statusCell.append(status);
        row.append(statusCell);
        return row;
    });

    elements.courseRows.replaceChildren(...rows);
    elements.courseCount.textContent = `${courses.length} sample courses`;
}

renderSummary();
renderCourseChart();
renderWeeklyChart();
renderCourseTable();
