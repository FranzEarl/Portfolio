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
    <title>C Programs | Personal Portfolio</title>
    <link rel="stylesheet" href="../styles.css">
</head>
<body>

    <header>
        <nav class="navbar">
            <a href="../index.html" class="logo">Franz Earl</a>
            <a href="../index.html" class="back-link">← Back to Portfolio</a>
        </nav>
    </header>

    <main>
        <section class="programs-page">
            <div class="programs-container">

                <div class="programs-heading">
                    <p class="section-label">PROJECTS / C PROGRAMMING</p>
                    <h1>C Programs<span>.</span></h1>
                    <p class="section-description">
                        A collection of programs and experiments developed using C.
                    </p>
                </div>

                <div class="file-list">
{links}                </div>

                <footer>{len(files)} programs · Written in C</footer>

            </div>
        </section>
    </main>

</body>
</html>
"""

output = Path(__file__).parent / "c-programs.html"
output.write_text(html, encoding="utf-8")

print(f"Homepage updated! Found {len(files)} C programs.")