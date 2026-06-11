// NbS case studies coverage map.
// Uses D3 + topojson to render a Natural Earth world projection,
// shades each country by case count. Counts only — individual study
// names are deliberately never published on this public page.

// Country-name reconciliation. The world-atlas TopoJSON uses one set of names;
// our CSVs use another. Add aliases here as you spot mismatches.
const COUNTRY_ALIASES = {
  "United States of America": ["United States", "USA", "US"],
  "United Kingdom": ["UK", "Britain", "Great Britain"],
  "Tanzania": ["Tanzania, United Republic of"],
  "Iran": ["Iran (Islamic Republic of)"],
  "Vietnam": ["Viet Nam"],
  "Russia": ["Russian Federation"],
  "Czechia": ["Czech Republic"],
  "Dem. Rep. Congo": ["Democratic Republic of the Congo", "Congo (Democratic Republic)"],
  "Congo": ["Republic of the Congo", "Congo (Republic)"],
  "Eswatini": ["Swaziland"],
  "N. Cyprus": ["Northern Cyprus"],
  "S. Sudan": ["South Sudan"],
  "Bosnia and Herz.": ["Bosnia and Herzegovina"],
  "Dominican Rep.": ["Dominican Republic"],
  "Central African Rep.": ["Central African Republic"],
  "Eq. Guinea": ["Equatorial Guinea"],
  "W. Sahara": ["Western Sahara"],
};

function buildNameLookup() {
  // For each "official" topo name, list all variants we map to it.
  const lookup = {};
  Object.entries(COUNTRY_ALIASES).forEach(([topoName, variants]) => {
    lookup[topoName.toLowerCase()] = topoName;
    variants.forEach(v => { lookup[v.toLowerCase()] = topoName; });
  });
  return lookup;
}

function colorFor(count) {
  if (count <= 0) return "#eeeeee";
  if (count === 1) return "#c7e9c0";
  if (count <= 4) return "#74c476";
  if (count <= 9) return "#31a354";
  return "#006d2c";
}

Promise.all([
  d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
  d3.json("cases.json").catch(() => ({})),  // tolerate missing cases.json on first deploy
]).then(([world, data]) => {
  const countries = topojson.feature(world, world.objects.countries);
  const nameLookup = buildNameLookup();

  // cases.json maps country name -> count. (Guard: if an old-format flat
  // array of case objects ever shows up, aggregate it to counts and drop
  // the rest — nothing beyond country/count may be rendered publicly.)
  const rawCounts = Array.isArray(data)
    ? data.reduce((acc, c) => {
        const k = (c.country || "").trim();
        if (k) acc[k] = (acc[k] || 0) + 1;
        return acc;
      }, {})
    : (data || {});

  // Build a map: topo country name -> count
  const countByCountry = {};
  Object.entries(rawCounts).forEach(([raw, n]) => {
    const norm = nameLookup[raw.trim().toLowerCase()] || raw.trim();
    countByCountry[norm] = (countByCountry[norm] || 0) + n;
  });

  // Summary
  const totalCases = Object.values(countByCountry).reduce((a, b) => a + b, 0);
  const totalCountries = Object.keys(countByCountry).length;
  d3.select("#case-count-summary")
    .text(`${totalCases} case${totalCases === 1 ? "" : "s"} across ${totalCountries} countr${totalCountries === 1 ? "y" : "ies"}.`);

  // Map dimensions
  const width = 960;
  const height = 500;

  const projection = d3.geoNaturalEarth1()
    .scale(190)
    .translate([width / 2, height / 2 + 20]);
  const path = d3.geoPath().projection(projection);

  const svg = d3.select("#map")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  // Tooltip
  const tooltip = d3.select("body").append("div").attr("class", "map-tooltip").style("opacity", 0);

  // Draw graticule for subtle visual context
  svg.append("path")
    .datum(d3.geoGraticule10())
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "#dde")
    .attr("stroke-width", 0.4);

  svg.selectAll(".country")
    .data(countries.features)
    .join("path")
    .attr("class", "country")
    .attr("d", path)
    .attr("fill", d => colorFor(countByCountry[d.properties.name] || 0))
    .attr("stroke", "#777")
    .attr("stroke-width", 0.4)
    .on("mouseover", (e, d) => {
      const n = countByCountry[d.properties.name] || 0;
      tooltip.transition().duration(120).style("opacity", 1);
      tooltip
        .html(`<strong>${d.properties.name}</strong><br/>${n} case${n === 1 ? "" : "s"}`)
        .style("left", (e.pageX + 12) + "px")
        .style("top", (e.pageY - 28) + "px");
    })
    .on("mousemove", (e) => {
      tooltip.style("left", (e.pageX + 12) + "px").style("top", (e.pageY - 28) + "px");
    })
    .on("mouseout", () => {
      tooltip.transition().duration(280).style("opacity", 0);
    })
    .on("click", (_, d) => {
      const n = countByCountry[d.properties.name] || 0;
      const list = d3.select("#case-list");
      list.html("");
      list.append("h2").text(`${d.properties.name} — ${n} case${n === 1 ? "" : "s"}`);
      if (!n) {
        list.append("p").html(
          `No NbS case studies documented here yet. ` +
          `<a href="index.html">Submit one</a> if you know of a project that should be on the platform.`
        );
        return;
      }
      list.append("p").html(
        `${n} documented case stud${n === 1 ? "y" : "ies"} on the platform. ` +
        `Know of another? <a href="index.html">Suggest it via the team portal</a>.`
      );
    });
});
