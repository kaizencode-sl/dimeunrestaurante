import maplibreCss from "maplibre-gl/dist/maplibre-gl.css?url"
import mapCss from "@/styles/moon-map.css?url"

/**
 * The map's styles, for a page that shows the map only further down (the
 * home page): linked when the map loads, so they never hold up the first
 * paint. The map page imports them the usual way.
 */
export const loadMapStyles = () =>
  Promise.all(
    [maplibreCss, mapCss].map(
      (href) =>
        new Promise<void>((resolve) => {
          if (document.querySelector(`link[href="${href}"]`)) return resolve()
          const link = document.createElement("link")
          link.rel = "stylesheet"
          link.href = href
          link.onload = link.onerror = () => resolve()
          document.head.append(link)
        })
    )
  )
