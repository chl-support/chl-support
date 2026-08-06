/* @ds-bundle: {"format":4,"namespace":"DhanyIndraswaraDesignSystem_58b8bd","components":[],"sourceHashes":{"ui_kits/media_kit_website/About.jsx":"f5beee6651a6","ui_kits/media_kit_website/Audience.jsx":"0f473587ab59","ui_kits/media_kit_website/BrandIcon.jsx":"12c4c0f47822","ui_kits/media_kit_website/Collab.jsx":"e35dd515abf2","ui_kits/media_kit_website/FinalCTA.jsx":"583d11911608","ui_kits/media_kit_website/Footer.jsx":"e7f7c6d4d7ae","ui_kits/media_kit_website/Hero.jsx":"5d152348e061","ui_kits/media_kit_website/Partners.jsx":"dd2fa1307a69","ui_kits/media_kit_website/Pillars.jsx":"bd32b138e6bf","ui_kits/media_kit_website/Process.jsx":"590dfe2f7491","ui_kits/media_kit_website/Shared.jsx":"fd6f38944c8b","ui_kits/media_kit_website/SocialReach.jsx":"77a83c8c0cfa","ui_kits/media_kit_website/TopNav.jsx":"986f1fd17697","ui_kits/media_kit_website/WhyBrands.jsx":"51b97f7e17d5"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.DhanyIndraswaraDesignSystem_58b8bd = window.DhanyIndraswaraDesignSystem_58b8bd || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// ui_kits/media_kit_website/About.jsx
try { (() => {
/* global React, Section, SectionHeader, GlassCard, Icon */

function About() {
  const pillars = [{
    icon: "graduation-cap",
    title: "Practical, not theoretical",
    body: "Every post is something you can apply at work tomorrow — built from real BI and analytics work."
  }, {
    icon: "user-check",
    title: "A real working audience",
    body: "Analysts, BI developers, product folks, and learners actively levelling up. Engaged daily."
  }, {
    icon: "shield-check",
    title: "Brand-safe & professional",
    body: "Educational, on-brand, on-deadline. No clickbait, no controversy, no missed deliverables."
  }];
  return /*#__PURE__*/React.createElement(Section, {
    id: "about",
    className: "section--about"
  }, /*#__PURE__*/React.createElement("div", {
    className: "about-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "about-intro"
  }, /*#__PURE__*/React.createElement(SectionHeader, {
    eyebrow: "About",
    title: "AI Developer & Educator with a working audience.",
    subtitle: "I've been creating practical, no-fluff content around Power BI, data analytics, and AI for productivity for years \u2014 for the people who actually do this work for a living."
  }), /*#__PURE__*/React.createElement("div", {
    className: "about-tags"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pill pill--soft"
  }, "AI Developer"), /*#__PURE__*/React.createElement("span", {
    className: "pill pill--soft"
  }, "AI Educator"), /*#__PURE__*/React.createElement("span", {
    className: "pill pill--soft"
  }, "Power BI"), /*#__PURE__*/React.createElement("span", {
    className: "pill pill--soft"
  }, "Data Analytics"), /*#__PURE__*/React.createElement("span", {
    className: "pill pill--soft"
  }, "AI for Productivity"), /*#__PURE__*/React.createElement("span", {
    className: "pill pill--soft"
  }, "Dashboard Design"), /*#__PURE__*/React.createElement("span", {
    className: "pill pill--soft"
  }, "Career Growth"))), /*#__PURE__*/React.createElement("div", {
    className: "about-pillars"
  }, pillars.map(p => /*#__PURE__*/React.createElement(GlassCard, {
    key: p.title,
    className: "about-pillar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "about-pillar-icon"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: p.icon,
    size: 22
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "about-pillar-title"
  }, p.title), /*#__PURE__*/React.createElement("p", {
    className: "about-pillar-body"
  }, p.body)))))));
}
window.About = About;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/media_kit_website/About.jsx", error: String((e && e.message) || e) }); }

// ui_kits/media_kit_website/Audience.jsx
try { (() => {
/* global React, Section, SectionHeader, GlassCard, Icon, useInView, useCountUp */

function Bar({
  label,
  pct,
  value,
  color = "#02A0C1",
  active
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "bar-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bar-row-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "bar-label"
  }, label), /*#__PURE__*/React.createElement("span", {
    className: "bar-value"
  }, value)), /*#__PURE__*/React.createElement("div", {
    className: "bar-track"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bar-fill",
    style: {
      width: (active ? pct : 0) + "%",
      background: color
    }
  })));
}
const TOP_ROLES = [{
  rank: "01",
  icon: "store",
  name: "Business Owner & Ops",
  pct: "32%"
}, {
  rank: "02",
  icon: "bar-chart-3",
  name: "Data Analyst & BI Developer",
  pct: "28%"
}, {
  rank: "03",
  icon: "graduation-cap",
  name: "Learner / Employee non-IT",
  pct: "18%"
}, {
  rank: "04",
  icon: "user",
  name: "Student",
  pct: "12%"
}, {
  rank: "05",
  icon: "users",
  name: "Others",
  pct: "10%"
}];
function AgeCard() {
  const [ref, inView] = useInView({
    threshold: 0.35
  });
  return /*#__PURE__*/React.createElement(GlassCard, {
    className: `audience-card ${inView ? "is-revealed" : ""}`
  }, /*#__PURE__*/React.createElement("div", {
    ref: ref
  }, /*#__PURE__*/React.createElement("h3", {
    className: "audience-card-title"
  }, "By age"), /*#__PURE__*/React.createElement("div", {
    className: "bars"
  }, /*#__PURE__*/React.createElement(Bar, {
    label: "18\u201324",
    pct: 28,
    value: "28%",
    active: inView
  }), /*#__PURE__*/React.createElement(Bar, {
    label: "25\u201334",
    pct: 46,
    value: "46%",
    active: inView
  }), /*#__PURE__*/React.createElement(Bar, {
    label: "35\u201344",
    pct: 18,
    value: "18%",
    active: inView
  }), /*#__PURE__*/React.createElement(Bar, {
    label: "45+",
    pct: 8,
    value: "8%",
    active: inView
  }))));
}
function GenderCard() {
  const [ref, inView] = useInView({
    threshold: 0.4
  });
  const malePct = useCountUp(62, {
    active: inView,
    duration: 1600
  });
  // ramp donut from 0% → 62% on view
  const donutPct = inView ? 62 : 0;
  return /*#__PURE__*/React.createElement(GlassCard, {
    className: `audience-card ${inView ? "is-revealed" : ""}`
  }, /*#__PURE__*/React.createElement("div", {
    ref: ref
  }, /*#__PURE__*/React.createElement("h3", {
    className: "audience-card-title"
  }, "By gender"), /*#__PURE__*/React.createElement("div", {
    className: "donut-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "donut",
    style: {
      background: `conic-gradient(#02A0C1 0 ${donutPct}%, #97D1C6 ${donutPct}% 100%)`
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "donut-inner"
  }, malePct, " / ", Math.max(0, 100 - malePct))), /*#__PURE__*/React.createElement("ul", {
    className: "legend"
  }, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
    className: "dot",
    style: {
      background: "#02A0C1"
    }
  }), " Male \xB7 62%"), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
    className: "dot",
    style: {
      background: "#97D1C6"
    }
  }), " Female \xB7 38%")))));
}
function RolesCard() {
  const [ref, inView] = useInView({
    threshold: 0.3
  });
  return /*#__PURE__*/React.createElement(GlassCard, {
    className: `audience-card ${inView ? "is-revealed" : ""}`
  }, /*#__PURE__*/React.createElement("div", {
    ref: ref
  }, /*#__PURE__*/React.createElement("h3", {
    className: "audience-card-title"
  }, "Top roles"), /*#__PURE__*/React.createElement("ul", {
    className: "role-list role-list--ranked"
  }, TOP_ROLES.map(r => /*#__PURE__*/React.createElement("li", {
    key: r.rank
  }, /*#__PURE__*/React.createElement("span", {
    className: "role-rank"
  }, "Top ", r.rank), /*#__PURE__*/React.createElement("span", {
    className: "role-icon"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: r.icon,
    size: 16
  })), /*#__PURE__*/React.createElement("span", {
    className: "role-name"
  }, r.name), /*#__PURE__*/React.createElement("span", {
    className: "role-pct"
  }, r.pct))))));
}
function GeoCard() {
  const [ref, inView] = useInView({
    threshold: 0.35
  });
  return /*#__PURE__*/React.createElement(GlassCard, {
    className: `audience-card ${inView ? "is-revealed" : ""}`
  }, /*#__PURE__*/React.createElement("div", {
    ref: ref
  }, /*#__PURE__*/React.createElement("h3", {
    className: "audience-card-title"
  }, "By geography"), /*#__PURE__*/React.createElement("div", {
    className: "geo-split"
  }, /*#__PURE__*/React.createElement("div", {
    className: "geo-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "geo-seg geo-seg--id",
    style: {
      width: inView ? "65%" : "0%"
    }
  }, /*#__PURE__*/React.createElement("span", null, "\uD83C\uDDEE\uD83C\uDDE9 Indonesia"), /*#__PURE__*/React.createElement("span", {
    className: "geo-pct"
  }, "65%")), /*#__PURE__*/React.createElement("div", {
    className: "geo-seg geo-seg--intl",
    style: {
      width: inView ? "35%" : "0%"
    }
  }, /*#__PURE__*/React.createElement("span", null, "\uD83C\uDF10 International"), /*#__PURE__*/React.createElement("span", {
    className: "geo-pct"
  }, "35%"))), /*#__PURE__*/React.createElement("div", {
    className: "geo-intl-list"
  }, /*#__PURE__*/React.createElement("span", {
    className: "geo-intl-title"
  }, "Top international markets"), /*#__PURE__*/React.createElement("div", {
    className: "geo-intl-chips"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pill pill--soft pill--sm"
  }, "\uD83C\uDDF2\uD83C\uDDFE Malaysia"), /*#__PURE__*/React.createElement("span", {
    className: "pill pill--soft pill--sm"
  }, "\uD83C\uDDF8\uD83C\uDDEC Singapore"), /*#__PURE__*/React.createElement("span", {
    className: "pill pill--soft pill--sm"
  }, "\uD83C\uDDF5\uD83C\uDDED Philippines"), /*#__PURE__*/React.createElement("span", {
    className: "pill pill--soft pill--sm"
  }, "\uD83C\uDDFA\uD83C\uDDF8 United States"), /*#__PURE__*/React.createElement("span", {
    className: "pill pill--soft pill--sm"
  }, "\uD83C\uDDEE\uD83C\uDDF3 India"))))));
}
function Audience() {
  return /*#__PURE__*/React.createElement(Section, {
    id: "audience",
    className: "section--audience"
  }, /*#__PURE__*/React.createElement(SectionHeader, {
    eyebrow: "Audience snapshot",
    title: "Working professionals who care about getting better at their craft.",
    subtitle: "Numbers are based on platform insights \u2014 Instagram primary, others representative."
  }), /*#__PURE__*/React.createElement("div", {
    className: "audience-grid"
  }, /*#__PURE__*/React.createElement(AgeCard, null), /*#__PURE__*/React.createElement(GenderCard, null), /*#__PURE__*/React.createElement(RolesCard, null), /*#__PURE__*/React.createElement(GeoCard, null)), /*#__PURE__*/React.createElement("p", {
    className: "audience-foot"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 14
  }), " Demographics are based on platform insights \u2014 request the latest report for full breakdown."));
}
window.Audience = Audience;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/media_kit_website/Audience.jsx", error: String((e && e.message) || e) }); }

// ui_kits/media_kit_website/BrandIcon.jsx
try { (() => {
/* global React */

// Inline SVGs for brand icons that need guaranteed rendering.
// (Simple Icons CDN occasionally fails for linkedin / whatsapp — inline is safer.)
const INLINE_BRAND = {
  linkedin: {
    color: "#0A66C2",
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.852 3.37-1.852 3.601 0 4.267 2.37 4.267 5.455v6.288zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
  },
  whatsapp: {
    color: "#25D366",
    path: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
  }
};
function BrandIcon({
  name,
  size = 22,
  mono = false,
  color
}) {
  // Inline path for icons we don't trust the CDN to serve.
  const inline = INLINE_BRAND[name];
  if (inline) {
    const fill = mono ? color || "#1F1F1F" : inline.color;
    return /*#__PURE__*/React.createElement("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      width: size,
      height: size,
      role: "img",
      "aria-label": name,
      style: {
        display: "block",
        width: size,
        height: size
      }
    }, /*#__PURE__*/React.createElement("path", {
      fill: fill,
      d: inline.path
    }));
  }
  const url = mono ? `https://cdn.simpleicons.org/${name}/${(color || "ffffff").replace("#", "")}` : `https://cdn.simpleicons.org/${name}`;
  return /*#__PURE__*/React.createElement("img", {
    src: url,
    alt: name,
    width: size,
    height: size,
    style: {
      display: "block",
      width: size,
      height: size
    },
    loading: "lazy"
  });
}
window.BrandIcon = BrandIcon;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/media_kit_website/BrandIcon.jsx", error: String((e && e.message) || e) }); }

// ui_kits/media_kit_website/Collab.jsx
try { (() => {
/* global React, Section, SectionHeader, Button, Icon */

const OPTIONS = [{
  key: "single",
  title: "Single Reel / Post",
  sub: "Post on Instagram + TikTok + Story on IG.",
  price: "$250",
  unit: "/ piece",
  badge: null,
  bullets: ["1× Reel or feed Post on Instagram", "1× Cross-post on TikTok", "1× dedicated Story on Instagram (free bonus)", "Concept + script co-developed", "Brief + 2 revision rounds", "30-day usage rights", "Post-campaign metrics report"],
  cta: "Book a single piece"
}, {
  key: "bundle",
  title: "Bundle · All Platforms",
  sub: "Posted across all 5 social media platforms.",
  price: "$320",
  unit: " · bundle",
  badge: "Best value",
  bullets: ["1× Reel + 1× feed Post on Instagram", "1× Cross-post on TikTok, Facebook, X / Twitter, LinkedIn", "1× dedicated Story on Instagram (free bonus)", "Co-developed concept + script", "Branded final slide + CTA", "60-day usage rights", "Detailed reach & engagement report (all platforms)"],
  cta: "Book the bundle",
  featured: true
}, {
  key: "longterm",
  title: "Long-term Collaboration",
  sub: "Monthly partnership — very open to this.",
  price: "By discussion",
  unit: " · monthly",
  badge: "Open for this",
  bullets: ["Monthly content cadence (negotiable)", "Co-branded series identity", "Cross-posting across all 5 platforms", "Mention in monthly newsletter", "Quarterly performance review", "First-look on new formats"],
  cta: "Let's talk monthly"
}];
const EXTRAS = [{
  icon: "gift",
  title: "Story Bonus",
  body: "Every package includes a free Story repost — extra reach at no extra cost.",
  tag: "Free"
}, {
  icon: "video",
  title: "UGC (User-Generated Content)",
  body: "Raw or lightly-edited UGC clips for your own ads and channels. Scoped per brief.",
  tag: "Available"
}, {
  icon: "presentation",
  title: "Custom formats",
  body: "Live workshops, dashboard reviews, course collabs — happy to scope on request.",
  tag: "On request"
}];
function Collab({
  onCTA
}) {
  return /*#__PURE__*/React.createElement(Section, {
    id: "collab",
    className: "section--collab"
  }, /*#__PURE__*/React.createElement(SectionHeader, {
    eyebrow: "Collaboration options",
    title: "Three ways to work together.",
    subtitle: "Clear, fair pricing. Story always included free. Long-term partnership is the easiest path."
  }), /*#__PURE__*/React.createElement("div", {
    className: "collab-grid"
  }, OPTIONS.map(o => /*#__PURE__*/React.createElement("div", {
    key: o.key,
    className: `collab-card ${o.featured ? "collab-card--featured" : ""}`
  }, o.badge && /*#__PURE__*/React.createElement("span", {
    className: `collab-badge ${o.featured ? "collab-badge--featured" : ""}`
  }, o.badge), /*#__PURE__*/React.createElement("h3", {
    className: "collab-title"
  }, o.title), /*#__PURE__*/React.createElement("p", {
    className: "collab-sub"
  }, o.sub), /*#__PURE__*/React.createElement("div", {
    className: "collab-price"
  }, o.price, /*#__PURE__*/React.createElement("span", null, o.unit)), /*#__PURE__*/React.createElement("ul", {
    className: "collab-bullets"
  }, o.bullets.map(b => /*#__PURE__*/React.createElement("li", {
    key: b
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 14
  }), " ", b))), /*#__PURE__*/React.createElement(Button, {
    variant: o.featured ? "primary" : "secondary",
    onClick: onCTA,
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-right",
      size: 16
    })
  }, o.cta)))), /*#__PURE__*/React.createElement("div", {
    className: "collab-extras"
  }, EXTRAS.map(e => /*#__PURE__*/React.createElement("div", {
    key: e.title,
    className: "collab-extra"
  }, /*#__PURE__*/React.createElement("div", {
    className: "collab-extra-icon"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: e.icon,
    size: 20
  })), /*#__PURE__*/React.createElement("div", {
    className: "collab-extra-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "collab-extra-head"
  }, /*#__PURE__*/React.createElement("h4", null, e.title), /*#__PURE__*/React.createElement("span", {
    className: `collab-extra-tag ${e.tag === "Free" ? "is-free" : ""}`
  }, e.tag)), /*#__PURE__*/React.createElement("p", null, e.body))))), /*#__PURE__*/React.createElement("p", {
    className: "collab-foot"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "message-circle",
    size: 14
  }), " All prices in USD \xB7 payable in IDR equivalent \xB7 invoice on request."));
}
window.Collab = Collab;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/media_kit_website/Collab.jsx", error: String((e && e.message) || e) }); }

// ui_kits/media_kit_website/FinalCTA.jsx
try { (() => {
/* global React, Halo, Button, Icon */

function FinalCTA({
  onCTA
}) {
  return /*#__PURE__*/React.createElement("section", {
    id: "cta",
    className: "final-cta"
  }, /*#__PURE__*/React.createElement(Halo, {
    variant: "cta"
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "final-card"
  }, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow eyebrow--on-light"
  }, "Ready when you are"), /*#__PURE__*/React.createElement("h2", {
    className: "final-title"
  }, "Let's build something ", /*#__PURE__*/React.createElement("span", {
    className: "hero-title-grad"
  }, "useful"), " together."), /*#__PURE__*/React.createElement("p", {
    className: "final-sub"
  }, "If your product helps people learn data, BI, AI, or career skills \u2014 we're a fit. Send a one-line brief on WhatsApp and we'll take it from there."), /*#__PURE__*/React.createElement("div", {
    className: "final-cta-row"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    onClick: onCTA,
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "message-circle",
      size: 18
    })
  }, "Chat on WhatsApp"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    as: "a",
    href: "mailto:halomas@dhanyindraswara.com"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "mail",
    size: 16
  }), " halomas@dhanyindraswara.com")), /*#__PURE__*/React.createElement("div", {
    className: "final-meta"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Icon, {
    name: "clock",
    size: 14
  }), " Reply within 24h"), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Icon, {
    name: "calendar",
    size: 14
  }), " 2-week lead time"), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Icon, {
    name: "shield-check",
    size: 14
  }), " Brand-safe content"))))));
}
window.FinalCTA = FinalCTA;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/media_kit_website/FinalCTA.jsx", error: String((e && e.message) || e) }); }

// ui_kits/media_kit_website/Footer.jsx
try { (() => {
/* global React, Icon, BrandIcon */

function Footer() {
  return /*#__PURE__*/React.createElement("footer", {
    className: "footer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "container footer-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "footer-brand"
  }, /*#__PURE__*/React.createElement("div", {
    className: "logo-lockup"
  }, /*#__PURE__*/React.createElement("div", {
    className: "logo-mark"
  }, "D"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "logo-name"
  }, "Dhany Indraswara"), /*#__PURE__*/React.createElement("div", {
    className: "logo-role"
  }, "AI Developer & Educator \xB7 Data & BI"))), /*#__PURE__*/React.createElement("p", {
    className: "footer-tag"
  }, "Practical educational content for data and AI professionals, brand-safe and made for collaboration.")), /*#__PURE__*/React.createElement("div", {
    className: "footer-col"
  }, /*#__PURE__*/React.createElement("h4", null, "Sections"), /*#__PURE__*/React.createElement("a", {
    href: "#about"
  }, "About"), /*#__PURE__*/React.createElement("a", {
    href: "#audience"
  }, "Audience"), /*#__PURE__*/React.createElement("a", {
    href: "#reach"
  }, "Reach"), /*#__PURE__*/React.createElement("a", {
    href: "#pillars"
  }, "Pillars"), /*#__PURE__*/React.createElement("a", {
    href: "#collab"
  }, "Collab options")), /*#__PURE__*/React.createElement("div", {
    className: "footer-col"
  }, /*#__PURE__*/React.createElement("h4", null, "Follow"), /*#__PURE__*/React.createElement("a", {
    href: "https://www.instagram.com/dhanyindraswara/",
    target: "_blank",
    rel: "noopener noreferrer",
    className: "footer-social"
  }, /*#__PURE__*/React.createElement(BrandIcon, {
    name: "instagram",
    size: 14
  }), " Instagram"), /*#__PURE__*/React.createElement("a", {
    href: "https://www.tiktok.com/@dhany.indraswara",
    target: "_blank",
    rel: "noopener noreferrer",
    className: "footer-social"
  }, /*#__PURE__*/React.createElement(BrandIcon, {
    name: "tiktok",
    size: 14
  }), " TikTok"), /*#__PURE__*/React.createElement("a", {
    href: "https://www.linkedin.com/in/dhany-indraswara/",
    target: "_blank",
    rel: "noopener noreferrer",
    className: "footer-social"
  }, /*#__PURE__*/React.createElement(BrandIcon, {
    name: "linkedin",
    size: 14
  }), " LinkedIn"), /*#__PURE__*/React.createElement("a", {
    href: "https://x.com/dhanyindraswara",
    target: "_blank",
    rel: "noopener noreferrer",
    className: "footer-social"
  }, /*#__PURE__*/React.createElement(BrandIcon, {
    name: "x",
    size: 14
  }), " X / Twitter"), /*#__PURE__*/React.createElement("a", {
    href: "https://www.facebook.com/dhany.indraswara",
    target: "_blank",
    rel: "noopener noreferrer",
    className: "footer-social"
  }, /*#__PURE__*/React.createElement(BrandIcon, {
    name: "facebook",
    size: 14
  }), " Facebook")), /*#__PURE__*/React.createElement("div", {
    className: "footer-col"
  }, /*#__PURE__*/React.createElement("h4", null, "Contact"), /*#__PURE__*/React.createElement("a", {
    href: "https://wa.me/6281805759025?text=Halo%20Dhany%2C%20saya%20tertarik%20untuk%20berkolaborasi.",
    target: "_blank",
    rel: "noopener noreferrer",
    className: "footer-social"
  }, /*#__PURE__*/React.createElement(BrandIcon, {
    name: "whatsapp",
    size: 14
  }), " +62 818 0575 9025"), /*#__PURE__*/React.createElement("a", {
    href: "mailto:halomas@dhanyindraswara.com"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "mail",
    size: 14
  }), " halomas@dhanyindraswara.com"), /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "map-pin",
    size: 14
  }), " Jakarta, Indonesia"))), /*#__PURE__*/React.createElement("div", {
    className: "container footer-base"
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 2026 Dhany Indraswara \xB7 Media Kit"), /*#__PURE__*/React.createElement("span", null, "Made for brands that care about the right audience.")));
}
window.Footer = Footer;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/media_kit_website/Footer.jsx", error: String((e && e.message) || e) }); }

// ui_kits/media_kit_website/Hero.jsx
try { (() => {
/* global React, Halo, Eyebrow, Button, GlassCard, Icon, BrandIcon, useInView, useCountUp, formatThousands */

function HeroCombinedNumber() {
  const [ref, inView] = useInView({
    threshold: 0.4
  });
  const value = useCountUp(82400, {
    active: inView,
    duration: 2000
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "hero-combined-num",
    ref: ref
  }, /*#__PURE__*/React.createElement("span", {
    className: "hero-combined-num-val"
  }, formatThousands(value)), /*#__PURE__*/React.createElement("span", {
    className: "hero-combined-plus"
  }, "+"));
}
function Hero({
  onCTA
}) {
  return /*#__PURE__*/React.createElement("section", {
    id: "top",
    className: "hero"
  }, /*#__PURE__*/React.createElement(Halo, {
    variant: "hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "container hero-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero-copy"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pill pill--lime"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pill-dot"
  }), " Open for collabs \xB7 Q2\u2013Q3 2026"), /*#__PURE__*/React.createElement("h1", {
    className: "hero-title"
  }, "Practical content.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    className: "hero-title-grad"
  }, "Real reach.")), /*#__PURE__*/React.createElement("p", {
    className: "hero-sub"
  }, "I'm Dhany \u2014 an ", /*#__PURE__*/React.createElement("strong", null, "AI Developer & Educator"), " teaching Power BI, data analytics, and AI for productivity. Built for brands that want real reach with the right audience."), /*#__PURE__*/React.createElement("div", {
    className: "hero-combined"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero-combined-main"
  }, /*#__PURE__*/React.createElement("span", {
    className: "hero-combined-lbl"
  }, "Combined audience"), /*#__PURE__*/React.createElement(HeroCombinedNumber, null), /*#__PURE__*/React.createElement("span", {
    className: "hero-combined-tag"
  }, "followers across 5 platforms")), /*#__PURE__*/React.createElement("div", {
    className: "hero-combined-divider"
  }), /*#__PURE__*/React.createElement("div", {
    className: "hero-combined-sub"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "hcs-n"
  }, "3M", /*#__PURE__*/React.createElement("span", null, "+")), /*#__PURE__*/React.createElement("div", {
    className: "hcs-l"
  }, "Monthly impressions \xB7 all platforms")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "hcs-n hcs-n--accent"
  }, "14%"), /*#__PURE__*/React.createElement("div", {
    className: "hcs-l"
  }, "Avg engagement")))), /*#__PURE__*/React.createElement("div", {
    className: "hero-cta-row"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    onClick: onCTA,
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-right",
      size: 18
    })
  }, "Start a collaboration"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    as: "a",
    href: "#collab"
  }, "See collaboration options")), /*#__PURE__*/React.createElement("div", {
    className: "hero-meta"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Icon, {
    name: "map-pin",
    size: 14
  }), " Jakarta, Indonesia"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Icon, {
    name: "globe",
    size: 14
  }), " English \xB7 Bahasa Indonesia"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Icon, {
    name: "clock",
    size: 14
  }), " Replies within 24h"))), /*#__PURE__*/React.createElement("div", {
    className: "hero-visual"
  }, /*#__PURE__*/React.createElement("div", {
    className: "portrait-ring"
  }, /*#__PURE__*/React.createElement("div", {
    className: "portrait-inner"
  }, /*#__PURE__*/React.createElement("img", {
    className: "portrait-photo",
    src: "../../assets/dhany-portrait.jpg",
    alt: "Dhany Indraswara speaking at an event"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "portrait-orbit",
    "aria-hidden": "false"
  }, /*#__PURE__*/React.createElement("a", {
    href: "https://www.instagram.com/dhanyindraswara/",
    target: "_blank",
    rel: "noopener noreferrer",
    className: "float-tile-link float-tile--a",
    "aria-label": "Open Instagram profile"
  }, /*#__PURE__*/React.createElement(GlassCard, {
    className: "float-tile"
  }, /*#__PURE__*/React.createElement("div", {
    className: "float-tile-icon",
    style: {
      background: "#fff",
      padding: 6
    }
  }, /*#__PURE__*/React.createElement(BrandIcon, {
    name: "instagram",
    size: 22
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "float-tile-num"
  }, "35,500+"), /*#__PURE__*/React.createElement("div", {
    className: "float-tile-lbl"
  }, "Instagram \xB7 primary")))), /*#__PURE__*/React.createElement("a", {
    href: "#reach",
    className: "float-tile-link float-tile--b",
    "aria-label": "Jump to reach section"
  }, /*#__PURE__*/React.createElement(GlassCard, {
    className: "float-tile"
  }, /*#__PURE__*/React.createElement("div", {
    className: "float-tile-icon",
    style: {
      background: "#D6FD91",
      color: "#1F1F1F"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trending-up",
    size: 18
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "float-tile-num"
  }, "3M+"), /*#__PURE__*/React.createElement("div", {
    className: "float-tile-lbl"
  }, "Monthly impressions")))), /*#__PURE__*/React.createElement("a", {
    href: "#audience",
    className: "float-tile-link float-tile--c",
    "aria-label": "Jump to audience section"
  }, /*#__PURE__*/React.createElement(GlassCard, {
    className: "float-tile"
  }, /*#__PURE__*/React.createElement("div", {
    className: "float-tile-icon",
    style: {
      background: "#D7E8FB",
      color: "#02A0C1"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkles",
    size: 18
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "float-tile-num"
  }, "14%"), /*#__PURE__*/React.createElement("div", {
    className: "float-tile-lbl"
  }, "Avg engagement")))))))));
}
window.Hero = Hero;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/media_kit_website/Hero.jsx", error: String((e && e.message) || e) }); }

// ui_kits/media_kit_website/Partners.jsx
try { (() => {
/* global React, Section, SectionHeader */

const BRANDS = [{
  name: "HiNoter",
  tier: "default"
}, {
  name: "HixAI",
  tier: "default"
}, {
  name: "Dibimbing",
  tier: "default"
}, {
  name: "DSArea",
  tier: "default"
}, {
  name: "Microsoft",
  tier: "featured"
}, {
  name: "Belajar Lagi",
  tier: "default"
}, {
  name: "Power BI Community ID",
  tier: "default"
}, {
  name: "Sipaling Logistic",
  tier: "default"
}, {
  name: "Telkom Indonesia Internasional",
  tier: "default"
}, {
  name: "XL Smart Indonesia",
  tier: "default"
}, {
  name: "SiCepat Ekspres Indonesia",
  tier: "default"
}, {
  name: "Insignia",
  tier: "default"
}, {
  name: "Unilever Global",
  tier: "featured"
}, {
  name: "3IT Chile",
  tier: "default"
}, {
  name: "Harita Group",
  tier: "default"
}];
function Partners() {
  return /*#__PURE__*/React.createElement(Section, {
    id: "partners",
    className: "section--partners"
  }, /*#__PURE__*/React.createElement(SectionHeader, {
    eyebrow: "Brands & platforms I've worked with",
    title: "15++ partners \u2014 from Indonesian unicorns to global brands.",
    subtitle: "Education platforms, SaaS, AI tools, telco, logistics, and global consumer brands. Each collaboration shipped on-brand and on-time."
  }), /*#__PURE__*/React.createElement("div", {
    className: "brands-strip"
  }, /*#__PURE__*/React.createElement("div", {
    className: "brands-row"
  }, BRANDS.map(b => /*#__PURE__*/React.createElement("span", {
    key: b.name,
    className: `brand-logo brand-logo--${b.tier}`
  }, b.name)), /*#__PURE__*/React.createElement("span", {
    className: "brand-logo brand-logo--more"
  }, "+ many more"))));
}
window.Partners = Partners;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/media_kit_website/Partners.jsx", error: String((e && e.message) || e) }); }

// ui_kits/media_kit_website/Pillars.jsx
try { (() => {
/* global React, Section, SectionHeader, Icon */

const PILLARS = [{
  icon: "bar-chart-3",
  title: "Data Analytics",
  body: "Frameworks, workflows, and habits for everyday analysis."
}, {
  icon: "layout-dashboard",
  title: "Power BI",
  body: "DAX, modelling, and report-building from a working dev."
}, {
  icon: "palette",
  title: "Dashboard Design",
  body: "Layout, color, and clarity — turning charts into stories."
}, {
  icon: "sparkles",
  title: "AI for Productivity",
  body: "Practical AI tools that save real hours each week."
}, {
  icon: "package",
  title: "Digital Product",
  body: "Building and shipping small digital products for analysts."
}, {
  icon: "workflow",
  title: "Business Process",
  body: "Mapping and improving the boring stuff that runs companies."
}, {
  icon: "briefcase",
  title: "Career Growth",
  body: "Interviewing, levelling up, and standing out in data."
}];
function Pillars() {
  return /*#__PURE__*/React.createElement(Section, {
    id: "pillars",
    className: "section--pillars"
  }, /*#__PURE__*/React.createElement(SectionHeader, {
    eyebrow: "Content pillars",
    title: "Seven topics \u2014 one consistent voice.",
    subtitle: "Each pillar maps cleanly to specific sponsor categories. Pick the ones that fit your brand."
  }), /*#__PURE__*/React.createElement("div", {
    className: "pillars-grid"
  }, PILLARS.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: p.title,
    className: "pillar-card",
    style: {
      "--i": i
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "pillar-icon"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: p.icon,
    size: 20
  })), /*#__PURE__*/React.createElement("div", {
    className: "pillar-content"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "pillar-title"
  }, p.title), /*#__PURE__*/React.createElement("p", {
    className: "pillar-body"
  }, p.body)), /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-up-right",
    size: 16
  })))));
}
window.Pillars = Pillars;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/media_kit_website/Pillars.jsx", error: String((e && e.message) || e) }); }

// ui_kits/media_kit_website/Process.jsx
try { (() => {
/* global React, Section, SectionHeader, Icon */

const STEPS = [{
  n: "01",
  icon: "mail",
  title: "Brief",
  body: "You send goals, audience, must-haves. I respond within 24h."
}, {
  n: "02",
  icon: "file-text",
  title: "Concept",
  body: "I draft the angle, script, and slide direction for your approval."
}, {
  n: "03",
  icon: "image",
  title: "Production",
  body: "I shoot, design, and finalize — two revision rounds included."
}, {
  n: "04",
  icon: "rocket",
  title: "Go-live",
  body: "Post + cross-channel push + a metrics report within 7 days."
}];
function Process() {
  return /*#__PURE__*/React.createElement(Section, {
    id: "process",
    className: "section--process"
  }, /*#__PURE__*/React.createElement(SectionHeader, {
    eyebrow: "The process",
    title: "From brief to go-live in 2 weeks.",
    subtitle: "Four steps. No surprises. Predictable timeline you can plan a launch around."
  }), /*#__PURE__*/React.createElement("div", {
    className: "process-grid"
  }, STEPS.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: s.n,
    className: "process-step"
  }, /*#__PURE__*/React.createElement("div", {
    className: "process-icon"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: s.icon,
    size: 22
  })), /*#__PURE__*/React.createElement("span", {
    className: "process-n"
  }, s.n), /*#__PURE__*/React.createElement("h3", {
    className: "process-title"
  }, s.title), /*#__PURE__*/React.createElement("p", {
    className: "process-body"
  }, s.body), i < STEPS.length - 1 && /*#__PURE__*/React.createElement("div", {
    className: "process-connector",
    "aria-hidden": "true"
  })))));
}
window.Process = Process;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/media_kit_website/Process.jsx", error: String((e && e.message) || e) }); }

// ui_kits/media_kit_website/Shared.jsx
try { (() => {
/* global React */
const {
  useState,
  useEffect,
  useRef
} = React;

// ===== Animation hooks ==================================================
// Returns [ref, inView] — fires once when element scrolls into view.
function useInView(opts = {
  threshold: 0.25,
  rootMargin: "0px 0px -40px 0px"
}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current || inView) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        io.disconnect();
      }
    }, opts);
    io.observe(ref.current);
    return () => io.disconnect();
  }, [inView]);
  return [ref, inView];
}

// Eased count-up from 0 → end. `active` gates the animation.
function useCountUp(end, {
  active = true,
  duration = 1800,
  decimals = 0
} = {}) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf, t0;
    const tick = t => {
      if (!t0) t0 = t;
      const p = Math.min((t - t0) / duration, 1);
      // easeOutQuart
      const eased = 1 - Math.pow(1 - p, 4);
      setValue(end * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end, active, duration]);
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
function formatThousands(n) {
  return n.toLocaleString("en-US");
}
window.useInView = useInView;
window.useCountUp = useCountUp;
window.formatThousands = formatThousands;

// ===== Halo background orbs ============================================
function Halo({
  children,
  variant = "default"
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "halo-wrap",
    "data-variant": variant
  }, /*#__PURE__*/React.createElement("div", {
    className: "halo halo-a"
  }), /*#__PURE__*/React.createElement("div", {
    className: "halo halo-b"
  }), /*#__PURE__*/React.createElement("div", {
    className: "halo-content"
  }, children));
}

// ===== Eyebrow ==========================================================
function Eyebrow({
  children,
  color
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "eyebrow",
    style: color ? {
      color
    } : undefined
  }, children);
}

// ===== Section header ===================================================
function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "left"
}) {
  return /*#__PURE__*/React.createElement("header", {
    className: `section-header section-header--${align}`
  }, eyebrow && /*#__PURE__*/React.createElement(Eyebrow, null, eyebrow), /*#__PURE__*/React.createElement("h2", {
    className: "section-title"
  }, title), subtitle && /*#__PURE__*/React.createElement("p", {
    className: "section-sub"
  }, subtitle));
}

// ===== Section wrapper ==================================================
function Section({
  id,
  children,
  className = ""
}) {
  return /*#__PURE__*/React.createElement("section", {
    id: id,
    className: `section ${className}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, children));
}

// ===== Button ===========================================================
function Button({
  variant = "primary",
  children,
  onClick,
  as = "button",
  href,
  icon
}) {
  const cls = `btn btn--${variant}`;
  if (as === "a") {
    return /*#__PURE__*/React.createElement("a", {
      className: cls,
      href: href,
      onClick: onClick
    }, children, icon && /*#__PURE__*/React.createElement("span", {
      className: "btn-icon"
    }, icon));
  }
  return /*#__PURE__*/React.createElement("button", {
    className: cls,
    onClick: onClick
  }, children, icon && /*#__PURE__*/React.createElement("span", {
    className: "btn-icon"
  }, icon));
}

// ===== Glass card =======================================================
function GlassCard({
  children,
  className = "",
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `glass-card ${className}`,
    style: style
  }, children);
}

// ===== Lucide icon (auto re-renders) ===================================
function Icon({
  name,
  size = 20,
  color
}) {
  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });
  const style = {
    width: size,
    height: size,
    color
  };
  return /*#__PURE__*/React.createElement("i", {
    "data-lucide": name,
    style: style
  });
}
window.Halo = Halo;
window.Eyebrow = Eyebrow;
window.SectionHeader = SectionHeader;
window.Section = Section;
window.Button = Button;
window.GlassCard = GlassCard;
window.Icon = Icon;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/media_kit_website/Shared.jsx", error: String((e && e.message) || e) }); }

// ui_kits/media_kit_website/SocialReach.jsx
try { (() => {
/* global React, Section, SectionHeader, GlassCard, BrandIcon, Icon, useInView, useCountUp, formatThousands */

// Update these URLs with your real profile links.
const PLATFORMS = [{
  key: "ig",
  slug: "instagram",
  name: "Instagram",
  handle: "@dhanyindraswara",
  url: "https://www.instagram.com/dhanyindraswara/",
  count: "35,500+",
  delta: "+12% MoM",
  primary: true
}, {
  key: "fb",
  slug: "facebook",
  name: "Facebook",
  handle: "Dhany Indraswara",
  url: "https://www.facebook.com/dhany.indraswara",
  count: "21,000+",
  delta: "+4% MoM"
}, {
  key: "tt",
  slug: "tiktok",
  name: "TikTok",
  handle: "@dhany.indraswara",
  url: "https://www.tiktok.com/@dhany.indraswara",
  count: "13,900+",
  delta: "+8% MoM"
}, {
  key: "tw",
  slug: "x",
  name: "X / Twitter",
  handle: "@dhanyindraswara",
  url: "https://x.com/dhanyindraswara",
  count: "8,600+",
  delta: "+3% MoM"
}, {
  key: "li",
  slug: "linkedin",
  name: "LinkedIn",
  handle: "Dhany Indraswara",
  url: "https://www.linkedin.com/in/dhany-indraswara/",
  count: "3,400+",
  delta: "+6% MoM"
}];
function SocialReach() {
  return /*#__PURE__*/React.createElement(Section, {
    id: "reach",
    className: "section--reach"
  }, /*#__PURE__*/React.createElement(SectionHeader, {
    eyebrow: "Social media reach",
    title: "One creator, five active platforms.",
    subtitle: "Instagram is the primary surface for brand collaborations. Cross-platform amplification available on request."
  }), /*#__PURE__*/React.createElement("div", {
    className: "reach-grid"
  }, PLATFORMS.map(p => /*#__PURE__*/React.createElement("a", {
    key: p.key,
    href: p.url,
    target: "_blank",
    rel: "noopener noreferrer",
    className: `reach-card glass-card ${p.primary ? "reach-card--primary" : ""}`,
    "aria-label": `Visit ${p.name} profile (opens in a new tab)`
  }, p.primary && /*#__PURE__*/React.createElement("span", {
    className: "reach-flag"
  }, "Primary"), /*#__PURE__*/React.createElement("div", {
    className: "reach-icon reach-icon--brand"
  }, /*#__PURE__*/React.createElement(BrandIcon, {
    name: p.slug,
    size: 28
  })), /*#__PURE__*/React.createElement("div", {
    className: "reach-count"
  }, p.count), /*#__PURE__*/React.createElement("div", {
    className: "reach-name"
  }, p.name), /*#__PURE__*/React.createElement("div", {
    className: "reach-handle"
  }, p.handle), /*#__PURE__*/React.createElement("span", {
    className: "reach-delta"
  }, p.delta), /*#__PURE__*/React.createElement("span", {
    className: "reach-visit"
  }, "Visit profile ", /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-up-right",
    size: 14
  }))))), /*#__PURE__*/React.createElement(ReachTotal, null));
}
function ReachTotal() {
  const [ref, inView] = useInView({
    threshold: 0.25
  });
  const followers = useCountUp(82400, {
    active: inView,
    duration: 1800
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "reach-total reach-total--big",
    ref: ref
  }, /*#__PURE__*/React.createElement("div", {
    className: "reach-total-left"
  }, /*#__PURE__*/React.createElement("span", {
    className: "reach-total-lbl"
  }, "Combined audience"), /*#__PURE__*/React.createElement("div", {
    className: "reach-total-num"
  }, /*#__PURE__*/React.createElement("span", null, formatThousands(followers)), /*#__PURE__*/React.createElement("span", {
    className: "reach-total-plus"
  }, "+")), /*#__PURE__*/React.createElement("span", {
    className: "reach-total-tag"
  }, "engaged followers across 5 platforms")), /*#__PURE__*/React.createElement("div", {
    className: "reach-total-stats"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rts-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rts-n"
  }, "3M", /*#__PURE__*/React.createElement("span", null, "+")), /*#__PURE__*/React.createElement("div", {
    className: "rts-l"
  }, "Monthly impressions \xB7 all platforms")), /*#__PURE__*/React.createElement("div", {
    className: "rts-card rts-card--accent"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rts-n"
  }, "14%"), /*#__PURE__*/React.createElement("div", {
    className: "rts-l"
  }, "Avg engagement rate")), /*#__PURE__*/React.createElement("div", {
    className: "rts-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rts-n"
  }, "24h"), /*#__PURE__*/React.createElement("div", {
    className: "rts-l"
  }, "Median reply time"))));
}
window.SocialReach = SocialReach;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/media_kit_website/SocialReach.jsx", error: String((e && e.message) || e) }); }

// ui_kits/media_kit_website/TopNav.jsx
try { (() => {
/* global React, Button, Icon */
const {
  useState,
  useEffect,
  useRef
} = React;
function TopNav({
  onCTA
}) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", onScroll, {
      passive: true
    });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: `topnav-wrap ${scrolled ? "topnav-wrap--scrolled" : ""}`
  }, /*#__PURE__*/React.createElement("nav", {
    className: "topnav"
  }, /*#__PURE__*/React.createElement("a", {
    className: "topnav-logo",
    href: "#top"
  }, /*#__PURE__*/React.createElement("div", {
    className: "topnav-mark"
  }, "D"), /*#__PURE__*/React.createElement("span", null, "Dhany Indraswara")), /*#__PURE__*/React.createElement("ul", {
    className: "topnav-links"
  }, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "#about"
  }, "About")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "#audience"
  }, "Audience")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "#reach"
  }, "Reach")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "#pillars"
  }, "Pillars")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "#collab"
  }, "Collab"))), /*#__PURE__*/React.createElement("div", {
    className: "topnav-cta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pill pill--lime pill--sm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pill-dot"
  }), " Open"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    onClick: onCTA,
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "message-circle",
      size: 14
    })
  }, "Chat on WhatsApp"))));
}
window.TopNav = TopNav;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/media_kit_website/TopNav.jsx", error: String((e && e.message) || e) }); }

// ui_kits/media_kit_website/WhyBrands.jsx
try { (() => {
/* global React, Section, SectionHeader, GlassCard, Icon */

const WHY = [{
  icon: "target",
  title: "Niche-fit audience",
  body: "Working analysts, BI developers, and AI-curious pros. Not random scroll traffic."
}, {
  icon: "trending-up",
  title: "High intent",
  body: "Followers come for tools and frameworks they'll actually try — high click-through, high save rate."
}, {
  icon: "shield-check",
  title: "Brand-safe",
  body: "Educational tone. No politics. No clickbait. Easy approval cycle."
}, {
  icon: "pen-tool",
  title: "Creator-led concept",
  body: "I write, design, and shoot every piece. You get a coherent voice, not a templated ad."
}, {
  icon: "calendar-check",
  title: "Reliable delivery",
  body: "Clear briefs. Two revision rounds. On-time without chasing."
}, {
  icon: "bar-chart-2",
  title: "Post-campaign report",
  body: "Reach, saves, profile visits, link clicks — sent within 7 days of go-live."
}];
function WhyBrands() {
  return /*#__PURE__*/React.createElement(Section, {
    id: "why",
    className: "section--why"
  }, /*#__PURE__*/React.createElement(SectionHeader, {
    eyebrow: "Why brands work with me",
    title: "Real outcomes \u2014 not vanity metrics.",
    subtitle: "Six things partners consistently say make this an easy collaboration."
  }), /*#__PURE__*/React.createElement("div", {
    className: "why-grid"
  }, WHY.map(w => /*#__PURE__*/React.createElement(GlassCard, {
    key: w.title,
    className: "why-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "why-icon"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: w.icon,
    size: 22
  })), /*#__PURE__*/React.createElement("h3", {
    className: "why-title"
  }, w.title), /*#__PURE__*/React.createElement("p", {
    className: "why-body"
  }, w.body)))));
}
window.WhyBrands = WhyBrands;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/media_kit_website/WhyBrands.jsx", error: String((e && e.message) || e) }); }

})();
