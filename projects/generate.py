from pathlib import Path
from html import escape
from urllib.parse import quote

folder = Path(__file__).parent / "c-programs"
files = sorted(folder.glob("*.c"), key=lambda f: f.name.lower())

links = ""

for file in files:
    name = escape(file.name)
    url = "c-programs/" + quote(file.name, safe="")
    links += f'                    <a href="{url}">{name}</a>\n'

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Browse {len(files)} small programs and experiments written in C by Franz Earl Padal.">
    <meta name="theme-color" content="#17191F">
    <title>C Programs | Franz Earl</title>
    <link rel="stylesheet" href="../styles.css">
</head>
<body>

    <header>
        <nav class="navbar">
            <a href="../index.html" class="logo">Franz Earl</a>
            <a href="../index.html#projects" class="back-link">← Back to Projects</a>
        </nav>
    </header>

    <main>
        <section class="programs-page">
            <div class="programs-container">

                <div class="programs-heading">
                    <p class="section-label">PROJECTS / C PROGRAMMING</p>
                    <h1>C Programs<span>.</span></h1>
                    <p class="section-description">
                        A collection of small terminal programs built while learning and
                        practicing C, from everyday utilities to interactive games.
                    </p>
                </div>

                <section class="program-overview" aria-label="About this project">
                    <article class="program-overview-card">
                        <p class="program-overview-label">THE PROJECT</p>
                        <h2>What I built</h2>
                        <p>
                            This collection includes calculators, date and number tools,
                            text utilities, simple trackers, and terminal games such as
                            Hangman, Tic-Tac-Toe, and Rock Paper Scissors.
                        </p>
                    </article>
                    <article class="program-overview-card">
                        <p class="program-overview-label">THE TOOLKIT</p>
                        <h2>Tools used</h2>
                        <p>
                            The programs are written in C using the standard library,
                            compiled with GCC, and designed to run in a terminal.
                        </p>
                    </article>
                    <article class="program-overview-card">
                        <p class="program-overview-label">THE PRACTICE</p>
                        <h2>What I practiced</h2>
                        <p>
                            Building them gave me practice with functions, loops,
                            conditionals, arrays and strings, input validation, file
                            handling, and working with dates and time.
                        </p>
                    </article>
                </section>

                <section class="program-overview-card" aria-labelledby="try-program-title">
                    <p class="program-overview-label">TRY IT HERE</p>
                    <h2 id="try-program-title">Run a C program</h2>
                    <p>Choose a program, enter its answers one per line, then run it. Programs execute in your browser; your input stays on this device. The clock shows a short snapshot, and the console games accept scripted key presses.</p>
                    <form id="c-runner-form">
                        <label for="c-runner-program">Program</label><select id="c-runner-program" name="program"></select>
                        <label for="c-runner-input">Input (one answer or key per line)</label><textarea id="c-runner-input" rows="5" placeholder="Enter program input here"></textarea>
                        <div class="runner-actions"><button type="submit">Run program</button><button type="button" id="c-runner-reset">Reset</button></div>
                    </form>
                    <p id="c-runner-status" role="status">Ready.</p><pre id="c-runner-output" aria-live="polite">Program output will appear here.</pre>
                </section>

                <div class="program-list-heading">
                    <div>
                        <p class="program-overview-label">SOURCE CODE</p>
                        <h2>Browse all programs</h2>
                    </div>
                    <span>{len(files)} files</span>
                </div>

                <div class="file-list">
{links}                </div>

                <footer>{len(files)} programs · Written in C</footer>

            </div>
        </section>
    </main>

<script type="module" src="c-programs/runner.js"></script>
</body>
</html>
"""

output = Path(__file__).parent / "c-programs.html"
output.write_text(html, encoding="utf-8")

print(f"Homepage updated! Found {len(files)} C programs.")

