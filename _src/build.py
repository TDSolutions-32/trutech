#!/usr/bin/env python3
"""Assemble the static pages: _src/pages/*.html + shared partials -> ../*.html

Tokens inside page files:
  <!--meta title="..." desc="..." nav="home"-->   (first line)
  {{icon:name}}   inline SVG icon
  {{cta}}         shared call-to-action band
  {{arrow}}       button arrow glyph
"""
import hashlib, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent

def ver(name):
    """Short content hash so browsers fetch fresh CSS/JS after every deploy."""
    return hashlib.sha1((ROOT / name).read_bytes()).hexdigest()[:8]
PAGES = ROOT / "_src" / "pages"

PHONE = "(561) 971-9512"
TEL = "+15619719512"
EMAIL = "TDSolutions@trutech.us"
FB = "https://www.facebook.com/profile.php?id=61566623883191"

ICONS = {
  "arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>',
  "arrow-ur": '<path d="M7 17 17 7M8 7h9v9"/>',
  "arrow-l": '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  "wallet": '<path d="M3 7a2 2 0 0 1 2-2h13v4"/><path d="M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2Z"/><circle cx="16" cy="14.5" r="1.2"/>',
  "spark": '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  "trend": '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  "code": '<path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 4l-4 16"/>',
  "shield": '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
  "server": '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
  "building": '<path d="M4 21V5l8-2v18M12 7l8 2v12M8 8h.01M8 12h.01M8 16h.01M16 12h.01M16 16h.01M2 21h20"/>',
  "chart": '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  "flag": '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  "star": '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9Z" fill="currentColor" stroke="none"/>',
  "phone": '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
  "mail": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  "pin": '<path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/>',
  "fb": '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v7h4v-7h3l1-4h-4V8a0 0 0 0 1 0 0Z"/>',
  "copy": '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  "file": '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6M9 14h6M9 17h4"/>',
  "search": '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  "users": '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/>',
  "layers": '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
  "lock": '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  "gauge": '<path d="M4 18a8 8 0 1 1 16 0"/><path d="m12 14 4-5"/>',
  "cart": '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.5 12h11.5l2-8H6.2"/>',
  "cap": '<path d="m2 9 10-5 10 5-10 5L2 9Z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6"/>',
  "check": '<path d="M5 12l5 5L20 7"/>',
  "access": '<circle cx="12" cy="4.5" r="1.8"/><path d="M5 8.5 12 10l7-1.5M12 10v5l-3 6M12 15l3 6"/>',
}

def icon(name, cls=""):
    return (f'<svg{(" class=%s" % chr(34) + cls + chr(34)) if cls else ""} viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            f'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONS[name]}</svg>')

ARROW = f'<span class="arr">{icon("arrow-ur")}</span>'

NAV = [
    ("home", "index.html", "Home"),
    ("solutions", "solutions.html", "Solutions"),
    ("work", "work.html", "Work"),
    ("about", "about.html", "About"),
    ("gov", "government.html", "Gov Contracting"),
    ("contact", "contact.html", "Contact"),
]

def head(title, desc, page):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<script>document.documentElement.classList.add("js");try{{if(sessionStorage.getItem("tt-wipe")){{document.documentElement.classList.add("entering");sessionStorage.removeItem("tt-wipe")}}}}catch(e){{}}</script>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#0B0F12">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="assets/logo.webp">
<meta property="og:type" content="website">
<link rel="icon" type="image/png" href="assets/favicon.png">
<link rel="apple-touch-icon" href="assets/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Manrope:wght@400;500;600;700;800&family=Sora:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="styles.css?v={ver('styles.css')}">
<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"ProfessionalService","name":"Truly Digital Solutions, LLC","alternateName":"TruTech","url":"https://trutech.us","logo":"https://trutech.us/assets/logo.webp","email":"{EMAIL}","telephone":"+1-561-971-9512","address":{{"@type":"PostalAddress","addressLocality":"Jacksonville","addressRegion":"NC","postalCode":"28546","addressCountry":"US"}},"areaServed":"United States","sameAs":["{FB}"],
"openingHoursSpecification":[{{"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Wednesday"],"opens":"10:00","closes":"17:00"}}]}}
</script>
</head>
<body data-page="{page}">
<a class="skip" href="#main">Skip to content</a>
<div class="wipe" aria-hidden="true"><img src="assets/logo-sm.webp" alt="" width="72" height="79"></div>
"""

def header(active):
    links = "\n".join(
        f'        <a href="{href}"{" aria-current=%spage%s" % (chr(34), chr(34)) if key == active else ""}>{label}</a>'
        for key, href, label in NAV)
    mlinks = "\n".join(
        f'      <a href="{href}"><small>0{i+1}</small>{label}</a>' for i, (key, href, label) in enumerate(NAV))
    return f"""<header class="site-header dark">
  <div class="wrap">
    <div class="nav">
      <a class="brand" href="index.html" aria-label="Truly Digital Solutions home">
        <img src="assets/logo-sm.webp" alt="" width="38" height="42">
        <span class="brand-txt"><b>Truly Digital</b><span>Solutions · TruTech</span></span>
      </a>
      <nav class="nav-links" aria-label="Primary">
{links}
      </nav>
      <div class="nav-cta">
        <a class="btn" href="contact.html#audit" data-magnetic>Free site audit {ARROW}</a>
        <button class="menu-btn" aria-label="Menu" aria-expanded="false" aria-controls="mobile-menu"><span></span><span></span></button>
      </div>
    </div>
  </div>
</header>
<div class="mobile-menu dark" id="mobile-menu" aria-hidden="true">
  <nav aria-label="Mobile">
{mlinks}
  </nav>
  <div class="mm-foot">
    <a href="tel:{TEL}">{PHONE}</a>
    <a href="mailto:{EMAIL}">{EMAIL}</a>
    <span>Jacksonville, NC 28546</span>
  </div>
</div>
"""

CTA = f"""<section class="section dark cta-band" aria-labelledby="cta-h">
  <img class="ghost-logo" src="assets/logo.webp" alt="" loading="lazy">
  <div class="wrap">
    <div>
      <span class="eyebrow">Free · 15 minutes · No obligation</span>
      <h2 id="cta-h" data-split style="margin-top:1.2rem">Let's see what<br>your site is <span class="glowtext">leaving</span><br>on the table.</h2>
    </div>
    <div class="cta-side" data-reveal>
      <p class="lead">Request a free technical site audit or a no-obligation design demo. If you don't love it, you pay nothing.</p>
      <a class="btn" href="contact.html#audit" data-magnetic>Request my free audit {ARROW}</a>
      <a class="link-arrow" href="tel:{TEL}">or call {PHONE} {icon("arrow")}</a>
    </div>
  </div>
</section>
"""

def footer():
    hours = [(1, "Monday", "10am – 5pm"), (2, "Tuesday", "Closed"), (3, "Wednesday", "10am – 5pm"),
             (4, "Thursday", "Closed"), (5, "Friday", "By appt."), (6, "Saturday", "Closed"), (0, "Sunday", "Closed")]
    hl = "\n".join(f'          <li data-day="{d}"><span>{n}</span><span>{h}</span></li>' for d, n, h in hours)
    return f"""<footer class="site-footer">
  <div class="wrap">
    <div class="foot-grid">
      <div class="foot-brand">
        <a class="brand" href="index.html"><img src="assets/logo-sm.webp" alt="" width="38" height="42"><span class="brand-txt"><b style="color:#fff">Truly Digital Solutions</b><span>Your friendly neighborhood web guys</span></span></a>
        <p>Affordable websites, IT, cybersecurity and government-ready infrastructure for small businesses and nonprofits — in Jacksonville, NC and across the country.</p>
        <div class="social">
          <a href="{FB}" target="_blank" rel="noopener" aria-label="Facebook">{icon("fb")}</a>
          <a href="mailto:{EMAIL}" aria-label="Email">{icon("mail")}</a>
          <a href="tel:{TEL}" aria-label="Call">{icon("phone")}</a>
        </div>
      </div>
      <div>
        <h4>Explore</h4>
        <ul>
          <li><a href="solutions.html">Solutions</a></li>
          <li><a href="solutions.html#plans">Plans &amp; pricing</a></li>
          <li><a href="solutions.html#care">Website care plans</a></li>
          <li><a href="work.html">Case studies</a></li>
          <li><a href="about.html">About us</a></li>
          <li><a href="government.html">Government contracting</a></li>
          <li><a href="contact.html#audit">Free website audit</a></li>
        </ul>
      </div>
      <div>
        <h4>Contact</h4>
        <ul>
          <li><a href="tel:{TEL}">{PHONE}</a></li>
          <li><a href="mailto:{EMAIL}">{EMAIL}</a></li>
          <li><a href="https://maps.google.com/?q=Jacksonville,+NC+28546" target="_blank" rel="noopener">Jacksonville, NC 28546</a></li>
        </ul>
        <div class="status" data-status style="margin-top:1.4rem"><i></i><span>Checking hours…</span></div>
      </div>
      <div>
        <h4>Hours (ET)</h4>
        <ul class="hours">
{hl}
        </ul>
      </div>
    </div>
    <div class="foot-mega" aria-hidden="true">TRULY DIGITAL</div>
    <div class="foot-bottom">
      <span>© <span data-year>2026</span> Truly Digital Solutions, LLC. All rights reserved.</span>
      <nav aria-label="Legal">
        <a href="https://trutech.us/privacy-policy">Privacy</a>
        <a href="https://trutech.us/terms-and-conditions">Terms</a>
        <a href="https://trutech.us/return-policy">Returns</a>
        <a href="https://trutech.us/accessibility">Accessibility</a>
      </nav>
    </div>
  </div>
</footer>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js" defer></script>
<script src="main.js?v={ver('main.js')}" defer></script>
</body>
</html>
"""

def build():
    for src in sorted(PAGES.glob("*.html")):
        raw = src.read_text()
        m = re.match(r'<!--meta title="(.*?)" desc="(.*?)" nav="(.*?)"-->\n', raw)
        title, desc, nav = m.groups()
        body = raw[m.end():]
        body = body.replace("{{cta}}", CTA).replace("{{arrow}}", ARROW)
        body = body.replace("{{phone}}", PHONE).replace("{{tel}}", TEL).replace("{{email}}", EMAIL)
        body = re.sub(r"\{\{icon:([\w-]+)\}\}", lambda mm: icon(mm.group(1)), body)
        out = head(title, desc, nav) + header(nav) + '<main id="main">\n' + body + "</main>\n" + footer()
        (ROOT / src.name).write_text(out)
        print("built", src.name)

if __name__ == "__main__":
    build()
