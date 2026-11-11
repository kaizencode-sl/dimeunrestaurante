import {
  Map as MapLibre,
  NavigationControl,
  Popup,
  type GeoJSONSource,
  setWorkerUrl,
  type MapLayerMouseEvent,
} from "maplibre-gl"
// Vite pre-bundles MapLibre away from its worker file, so point at it directly
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url"
import "maplibre-gl/dist/maplibre-gl.css"
import "@/styles/moon-map.css"
import { moonPath } from "@/lib/moon"

import type { Pin } from "@/lib/pins"
import { url } from "@/lib/url"
export type { Pin }

const STYLE = "https://tiles.openfreemap.org/styles/dark"
const SPAIN: [[number, number], [number, number]] = [
  [-9.6, 35.8],
  [4.4, 43.9],
]
const FONT = ["Noto Sans Bold"]

/**
 * Night palette: a black sea like the sky, land a shade lighter, streets that
 * only show up close, so the gold and the moons are the only light. Labels in
 * Spanish where OpenStreetMap has them.
 */
function retint(map: MapLibre) {
  const LAND = "#151413"
  const SEA = "#070707"
  const NAME_ES = ["coalesce", ["get", "name:es"], ["get", "name"]]
  for (const layer of map.getStyle().layers) {
    const { id, type } = layer
    const set = (
      prop: Parameters<MapLibre["setPaintProperty"]>[1],
      value: unknown
    ) => {
      try {
        map.setPaintProperty(id, prop, value as string)
      } catch {
        /* the layer doesn't take that property */
      }
    }
    if (type === "background") set("background-color", LAND)
    else if (type === "fill") {
      if (id === "water") set("fill-color", SEA)
      else if (id === "building") set("fill-color", "#1c1b19")
      else set("fill-opacity", 0)
    } else if (type === "line") {
      if (id.startsWith("boundary")) set("line-color", "#34312d")
      else if (id === "waterway") set("line-color", SEA)
      else {
        set("line-color", /major|motorway/.test(id) ? "#2a2825" : "#211f1d")
        // fade the road web in only at city zoom
        set("line-opacity", [
          "interpolate",
          ["linear"],
          ["zoom"],
          /motorway/.test(id) ? 5 : 9,
          0,
          /motorway/.test(id) ? 8 : 12,
          1,
        ])
      }
    } else if (type === "symbol") {
      set("text-color", id.startsWith("place") ? "#8d8a84" : "#55524d")
      set("text-halo-color", id.startsWith("water") ? SEA : LAND)
      set("icon-opacity", 0)
      if (id.startsWith("place") || id.startsWith("water"))
        try {
          map.setLayoutProperty(id, "text-field", NAME_ES as never)
        } catch {
          /* no label on this layer */
        }
    } else if (type === "hillshade" || type === "raster") {
      try {
        map.setLayoutProperty(id, "visibility", "none")
      } catch {
        /* keep it */
      }
    }
  }
}

/** One image per half-moon step: moon-0 … moon-20 */
function addMoonIcons(map: MapLibre) {
  const ratio = 2
  const size = 44
  for (let step = 0; step <= 20; step++) {
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = size * ratio
    const ctx = canvas.getContext("2d")!
    ctx.scale(ratio, ratio)
    ctx.translate(size / 2, size / 2)
    const r = 13
    // soft halo that grows with the score
    const halo = ctx.createRadialGradient(0, 0, r * 0.8, 0, 0, size / 2)
    halo.addColorStop(0, `rgba(247,236,208,${0.08 + (step / 20) * 0.22})`)
    halo.addColorStop(1, "rgba(247,236,208,0)")
    ctx.fillStyle = halo
    ctx.fillRect(-size / 2, -size / 2, size, size)
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fillStyle = "#2a2826"
    ctx.fill()
    ctx.lineWidth = 1.2
    ctx.strokeStyle = "rgba(242,179,61,.75)"
    ctx.stroke()
    const d = moonPath(step / 20, r)
    if (d) {
      ctx.fillStyle = "#f7ecd0"
      ctx.fill(new Path2D(d))
    }
    map.addImage(
      `moon-${step}`,
      ctx.getImageData(0, 0, canvas.width, canvas.height),
      { pixelRatio: ratio }
    )
  }
}

const escape = (s: string) =>
  s.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!
  )

function card(p: Pin) {
  const score = String(p.score).replace(".", ",")
  return `<a class="map-card" href="${url(`/restaurantes/${p.id}`)}">
    ${p.photo ? `<img src="${escape(p.photo)}" alt="" loading="lazy" />` : ""}
    <span class="map-card-body">
      <span class="map-card-city">${escape(p.city)}</span>
      <strong>${escape(p.name)}</strong>
      ${p.headline ? `<em>“${escape(p.headline)}”</em>` : ""}
      <span class="map-card-score"><svg viewBox="-110 -110 220 220" aria-hidden="true"><circle r="100" /><path d="${moonPath(p.score / 10)}" /></svg>${score} lunas</span>
    </span>
  </a>`
}

/**
 * The moon map. `embedded` is for a map inside a scrolling page (the
 * homepage): the page keeps the scroll and the map zooms with ctrl/two fingers.
 */
export function moonMap(
  root: HTMLElement,
  pins: Pin[],
  { embedded = false }: { embedded?: boolean } = {}
) {
  setWorkerUrl(workerUrl)
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
  // Keep pins out from under the floating panel
  const panel = root.querySelector<HTMLElement>(".panel")
  const pad = () => {
    const box = panel?.getBoundingClientRect()
    if (!box) return { top: 40, bottom: 40, left: 40, right: 40 }
    const wide = innerWidth > 640
    return {
      top: 90,
      bottom: wide ? 60 : (box ? innerHeight - box.top : 0) + 30,
      left: wide ? box.right + 40 : 30,
      right: 60,
    }
  }
  const map = new MapLibre({
    container: root.querySelector<HTMLElement>("[data-map]")!,
    style: STYLE,
    bounds: SPAIN,
    fitBoundsOptions: { padding: pad() },
    attributionControl: { compact: true },
    dragRotate: false,
    pitchWithRotate: false,
    cooperativeGestures: embedded,
    locale: {
      "CooperativeGesturesHandler.WindowsHelpText":
        "Usa Ctrl + rueda para hacer zoom",
      "CooperativeGesturesHandler.MacHelpText": "Usa ⌘ + rueda para hacer zoom",
      "CooperativeGesturesHandler.MobileHelpText":
        "Usa dos dedos para mover el mapa",
    },
  })
  map.touchZoomRotate.disableRotation()
  map.addControl(new NavigationControl({ showCompass: false }), "bottom-right")

  const toFeatures = (min: number) => ({
    type: "FeatureCollection" as const,
    features: pins
      .filter((p) => p.score >= min)
      .map((p) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [p.lon, p.lat] },
        properties: { id: p.id, score: p.score },
      })),
  })

  const popup = new Popup({
    closeButton: false,
    offset: 18,
    maxWidth: "300px",
    className: "map-popup",
  })
  const byId = new globalThis.Map(pins.map((p) => [p.id, p]))

  // The base style asks for a few sprite icons it never ships; answer with a
  // blank so they don't warn
  map.setMissingStyleImageResolver((id) => {
    if (!map.hasImage(id))
      map.addImage(id, { width: 1, height: 1, data: new Uint8Array(4) })
  })

  map.on("load", () => {
    retint(map)
    addMoonIcons(map)
    map.addSource("pins", {
      type: "geojson",
      data: toFeatures(0),
      cluster: true,
      clusterRadius: 44,
      clusterMaxZoom: 13,
      clusterProperties: { best: ["max", ["get", "score"]] },
    })
    map.addLayer({
      id: "clusters",
      type: "circle",
      source: "pins",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#f2b33d",
        "circle-opacity": 0.14,
        "circle-stroke-color": "#f2b33d",
        "circle-stroke-width": 1.2,
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["get", "point_count"],
          2,
          16,
          50,
          26,
          300,
          38,
        ],
      },
    })
    map.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: "pins",
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-font": FONT,
        "text-size": 13,
      },
      paint: { "text-color": "#f7ecd0" },
    })
    map.addLayer({
      id: "moons",
      type: "symbol",
      source: "pins",
      filter: ["!", ["has", "point_count"]],
      layout: {
        "icon-image": [
          "concat",
          "moon-",
          ["to-string", ["round", ["*", ["get", "score"], 2]]],
        ],
        "icon-size": ["interpolate", ["linear"], ["zoom"], 8, 0.8, 15, 1.15],
        "icon-allow-overlap": true,
        "symbol-sort-key": ["-", 10, ["get", "score"]],
      },
    })
    root.dataset.ready = ""
  })

  map.on("click", "clusters", async (e: MapLayerMouseEvent) => {
    const f = e.features?.[0]
    if (!f) return
    const source = map.getSource<GeoJSONSource>("pins")!
    const zoom = await source.getClusterExpansionZoom(
      f.properties.cluster_id as number
    )
    map.easeTo({
      center: (f.geometry as unknown as { coordinates: [number, number] })
        .coordinates,
      zoom,
      duration: reduced ? 0 : 700,
    })
  })
  map.on("click", "moons", (e: MapLayerMouseEvent) => {
    const f = e.features?.[0]
    const p = f && byId.get(f.properties.id as string)
    if (!p) return
    popup.setLngLat([p.lon, p.lat]).setHTML(card(p)).addTo(map)
  })
  for (const layer of ["clusters", "moons"]) {
    map.on(
      "mouseenter",
      layer,
      () => (map.getCanvas().style.cursor = "pointer")
    )
    map.on("mouseleave", layer, () => (map.getCanvas().style.cursor = ""))
  }

  // Minimum lunas
  const range = root.querySelector<HTMLInputElement>("[data-min]")
  const minLabel = root.querySelector<HTMLElement>("[data-min-label]")
  const count = root.querySelector<HTMLElement>("[data-count]")
  const minMoon = root.querySelector<SVGPathElement>("[data-min-moon]")
  const applyMin = () => {
    const min = Number(range?.value ?? 0)
    const data = toFeatures(min)
    if (minLabel) minLabel.textContent = String(min).replace(".", ",")
    if (count) count.textContent = String(data.features.length)
    minMoon?.setAttribute("d", moonPath(min / 10))
    map.getSource<GeoJSONSource>("pins")?.setData(data)
    popup.remove()
  }
  range?.addEventListener("input", applyMin)
  if (range) map.on("load", applyMin)

  // /mapa?r=<id> opens on that restaurant
  const start =
    !embedded && byId.get(new URLSearchParams(location.search).get("r") ?? "")
  if (start)
    map.once("load", () => {
      map.jumpTo({
        center: [start.lon, start.lat],
        zoom: 15,
        padding: { ...pad(), top: 300 },
      })
      popup.setLngLat([start.lon, start.lat]).setHTML(card(start)).addTo(map)
    })

  // Jump to a city
  root.querySelectorAll<HTMLButtonElement>("[data-fly]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const [w, s, e, n] = btn.dataset.fly!.split(",").map(Number)
      popup.remove()
      map.fitBounds(
        [
          [w, s],
          [e, n],
        ],
        { padding: pad(), maxZoom: 14, duration: reduced ? 0 : 1600 }
      )
    })
  )

  // Near me
  const near = root.querySelector<HTMLButtonElement>("[data-near]")
  near?.addEventListener("click", () => {
    near.textContent = "Buscando…"
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        near.textContent = "Cerca de mí"
        map.flyTo({
          center: [coords.longitude, coords.latitude],
          zoom: 14,
          duration: reduced ? 0 : 1800,
        })
      },
      () => (near.textContent = "Sin ubicación"),
      { timeout: 10000 }
    )
  })
}
