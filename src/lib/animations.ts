import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText } from "gsap/SplitText"
import Lenis from "lenis"
import { moonPath } from "@/lib/moon"
import { mountedMoonGL } from "@/lib/moon-gl"

gsap.registerPlugin(ScrollTrigger, SplitText)

// Seconds scrubbed animations take to catch up with the scroll: this lag, on
// top of Lenis, is what makes them glide instead of following every tick
const SCRUB = 1.1
const INTRO_KEY = "dime:intro-seen"
// Plays on the way in and stays. Not `once: true`: a trigger that kills itself
// while ScrollTrigger is refreshing its list breaks the refresh loop.
const PLAY_ONCE = "play none none none"

const $ = <T extends Element = HTMLElement>(
  sel: string,
  root: ParentNode = document
) => root.querySelector<T>(sel)
const $$ = <T extends Element = HTMLElement>(
  sel: string,
  root: ParentNode = document
) => gsap.utils.toArray<T>(root.querySelectorAll(sel))

const formatScore = (v: number) =>
  String(Math.round(v * 2) / 2).replace(".", ",")

function smoothScroll() {
  const lenis = new Lenis({ lerp: 0.09 })
  lenis.on("scroll", ScrollTrigger.update)
  gsap.ticker.add((t) => lenis.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
  return lenis
}

function seenIntro() {
  try {
    return sessionStorage.getItem(INTRO_KEY) === "1"
  } catch {
    return false
  }
}
function markIntro() {
  try {
    sessionStorage.setItem(INTRO_KEY, "1")
  } catch {
    /* private mode: the intro just plays again */
  }
}

// The homepage opening: a moon waxes from new to full while the counter runs
// to the number of reviews, DIME stamps onto it, and the full moon becomes the
// window the hero photo opens through. On a second visit in the same session
// only the opening plays. Scrolling then shrinks the photo back into a moon.
function intro(lenis: Lenis) {
  const loader = $("[data-loader]")
  const hero = $("[data-hero]")
  const media = $("[data-hero-media]")
  if (!hero || !media) return
  // Radii in px: the loader moon, a circle that covers the screen, and the
  // moon the photo becomes on scroll
  const moonR = () =>
    ($(".loader-moon")?.getBoundingClientRect().width ??
      Math.min(innerWidth, innerHeight) * 0.46) / 2
  const fullR = () => Math.hypot(innerWidth, innerHeight) / 2 + 2
  const endR = () => Math.min(innerWidth, innerHeight) * 0.3
  const circle = (r: number, y = 50) => `circle(${r}px at 50% ${y}%)`

  const tl = gsap.timeline({
    defaults: { ease: "power3.out" },
    onComplete: () => {
      lenis.start()
      markIntro()
    },
  })
  if (loader && !seenIntro()) {
    lenis.stop()
    const disc = $$<SVGPathElement>(".loader-disc [data-moon]", loader)
    const counter = $("[data-count]", loader)
    const total = Number(counter?.dataset.count ?? 0)
    const phase = { v: 0 }
    gsap.set(media, { clipPath: circle(moonR()) })
    tl.to(phase, {
      v: 1,
      duration: 1.6,
      ease: "power2.inOut",
      onUpdate: () => {
        disc.forEach((p) => p.setAttribute("d", moonPath(phase.v)))
        if (counter)
          counter.textContent = String(Math.round(phase.v * total)).padStart(
            3,
            "0"
          )
      },
    })
      .to(
        "[data-loader-stamp]",
        { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2.2)" },
        "-=.2"
      )
      .to("[data-loader-stamp]", {
        x: "+=6",
        duration: 0.05,
        repeat: 5,
        yoyo: true,
        ease: "none",
      })
      // Same night, same stars: fading the loader leaves the moon as a photo
      .to(loader, { opacity: 0, duration: 0.7, ease: "power2.inOut" }, "+=.25")
      .set(loader, { display: "none" })
      .to(
        media,
        { clipPath: circle(fullR()), duration: 1.4, ease: "expo.inOut" },
        "-=.1"
      )
  } else {
    if (loader) loader.style.display = "none"
    gsap.set(media, { clipPath: circle(0) })
    tl.to(media, {
      clipPath: circle(fullR()),
      duration: 1.4,
      ease: "expo.inOut",
    })
  }
  tl.to(
    "[data-hero-frame]",
    { scale: 1.05, duration: 2.2, ease: "expo.out" },
    "<"
  )
    .from(
      "[data-hero-word] .char",
      { yPercent: 110, duration: 1.1, stagger: 0.08, ease: "expo.out" },
      "-=1.0"
    )
    .from(
      "[data-hero-meta] > *",
      { y: 24, opacity: 0, duration: 0.8, stagger: 0.1 },
      "-=.8"
    )

  // Then the scroll takes over: the word grows and lifts, the photo closes
  // back into a moon hanging over it
  gsap
    .timeline({
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom bottom",
        scrub: SCRUB,
        invalidateOnRefresh: true,
      },
    })
    .to(
      "[data-hero-word]",
      { yPercent: -70, scale: 1.25, transformOrigin: "50% 100%", ease: "none" },
      0
    )
    .fromTo(
      media,
      { clipPath: () => circle(fullR()) },
      {
        clipPath: () => circle(endR(), 40),
        ease: "none",
        immediateRender: false,
      },
      0
    )
    .to("[data-hero-frame]", { scale: 1.3, ease: "none" }, 0)
    .to("[data-hero-meta]", { opacity: 0, y: -40, ease: "none" }, 0)
}

// A statement that lights up word by word as it is read
function words() {
  $$("[data-words]").forEach((el) => {
    gsap.to($$(".word", el), {
      opacity: 1,
      stagger: 0.1,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "top 80%",
        end: "bottom 45%",
        scrub: SCRUB,
      },
    })
  })
  $$<SVGSVGElement>("[data-orbit]").forEach((svg) => {
    const place = orbitAt(svg)
    const state = { p: 0 }
    place(0)
    gsap.to(state, {
      p: 1,
      ease: "none",
      onUpdate: () => place(state.p),
      scrollTrigger: {
        trigger: svg,
        start: "top 95%",
        end: "bottom 35%",
        scrub: SCRUB,
      },
    })
  })
}

// Puts the orbit's moon at a point along its path, lit to match: new at the
// start, full at the end
function orbitAt(svg: SVGSVGElement) {
  const path = $<SVGPathElement>(".orbit-path", svg)
  const moon = $<SVGGElement>("[data-orbit-moon]", svg)
  const lit = moon?.querySelector("path")
  const length = path?.getTotalLength() ?? 0
  return (p: number) => {
    if (!path || !moon || !lit) return
    const pt = path.getPointAtLength(p * length)
    moon.setAttribute("transform", `translate(${pt.x} ${pt.y})`)
    lit.setAttribute("d", moonPath(p, 22))
  }
}

// The scoring section: a moon fills from new to full while the number climbs
function moonScrub() {
  $$("[data-moon-scrub]").forEach((section) => {
    const paths = $$<SVGPathElement>(".moonwrap [data-moon]", section)
    const canvas = $<HTMLCanvasElement>("[data-moon-gl]", section)
    const score = $("[data-score]:not([data-moon-gl])", section)
    const examples = $$("[data-at]", section)
    const set = (v: number) => {
      paths.forEach((p) => p.setAttribute("d", moonPath(v / 10)))
      // The sphere exists once it nears the screen (shaded-moon.astro)
      if (canvas) {
        canvas.dataset.phase = String(v)
        mountedMoonGL(canvas)?.render(v / 10)
      }
      if (score) score.textContent = formatScore(v)
      examples.forEach((e) =>
        e.classList.toggle("is-on", Math.abs(Number(e.dataset.at) - v) < 0.5)
      )
    }
    const state = { v: 0 }
    set(0)
    gsap.to(state, {
      v: 10,
      ease: "none",
      onUpdate: () => set(state.v),
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: SCRUB,
      },
    })
    gsap.from($(".moonwrap", section), {
      rotate: -40,
      scale: 0.8,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "top top",
        scrub: SCRUB,
      },
    })
  })
}

// Wide type travelling sideways with the scroll, and stickers that drop in
function travellingType() {
  $$("[data-marquee]").forEach((line) => {
    const left = line.dataset.marquee === "left"
    const distance = () => -(line.scrollWidth - window.innerWidth * 0.6)
    gsap.fromTo(
      line,
      { x: left ? 0 : distance },
      {
        x: left ? distance : 0,
        ease: "none",
        scrollTrigger: {
          trigger: line.parentElement,
          start: "top bottom",
          end: "bottom top",
          scrub: SCRUB,
          invalidateOnRefresh: true,
        },
      }
    )
  })
  $$("[data-drop]").forEach((sticker, i) => {
    gsap.fromTo(
      sticker,
      { y: -300, rotate: 0, opacity: 0 },
      {
        y: 0,
        rotate: Number(sticker.dataset.drop ?? 0),
        opacity: 1,
        duration: 1,
        delay: i * 0.12,
        ease: "bounce.out",
        scrollTrigger: {
          trigger: sticker.parentElement,
          start: "top 55%",
          toggleActions: PLAY_ONCE,
        },
      }
    )
  })
}

// Display titles whose letters arrive one by one, once
function charTitles() {
  $$("[data-chars]").forEach((title) => {
    gsap.from(SplitText.create(title, { type: "words,chars" }).chars, {
      yPercent: 100,
      rotate: 8,
      opacity: 0,
      duration: 0.9,
      stagger: 0.035,
      ease: "power3.out",
      scrollTrigger: {
        trigger: title,
        start: "top 88%",
        toggleActions: PLAY_ONCE,
      },
    })
  })
}

// Rows and galleries: the head rises, each photo wipes open, the score stamps
function wipes() {
  $$("[data-row]").forEach((row) => {
    gsap
      .timeline({
        scrollTrigger: {
          trigger: row,
          start: "top 88%",
          toggleActions: PLAY_ONCE,
        },
      })
      .from($("[data-row-top]", row), {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      })
      .fromTo(
        $$("[data-wipe]", row),
        { clipPath: "inset(100% 0 0 0)" },
        {
          clipPath: "inset(0% 0 0 0)",
          duration: 1,
          stagger: 0.09,
          ease: "expo.out",
        },
        0.1
      )
      .from(
        $$("[data-wipe] img", row),
        { scale: 1.4, duration: 1.4, stagger: 0.09, ease: "expo.out" },
        0.1
      )
      .from(
        $("[data-stamp]", row),
        {
          scale: 2.2,
          rotate: -25,
          opacity: 0,
          duration: 0.6,
          ease: "back.out(2.5)",
        },
        0.5
      )
      .add(fillStamp($("[data-stamp]", row)), 0.7)
  })
  $$("[data-gallery]").forEach((gallery) => {
    $$("[data-wipe]", gallery).forEach((fig) => {
      gsap.fromTo(
        fig,
        { clipPath: "inset(100% 0 0 0)" },
        {
          clipPath: "inset(0% 0 0 0)",
          duration: 1.1,
          ease: "expo.out",
          scrollTrigger: {
            trigger: fig,
            start: "top 92%",
            toggleActions: PLAY_ONCE,
          },
        }
      )
    })
  })
}

// A score stamp's moon waxes up to its score
function fillStamp(stamp: HTMLElement | null) {
  const paths = stamp ? $$<SVGPathElement>("[data-moon]", stamp) : []
  const target = Number(stamp?.dataset.score ?? 0)
  const phase = { v: 0 }
  const draw = () =>
    paths.forEach((p) => p.setAttribute("d", moonPath(phase.v / 10)))
  draw()
  return gsap.to(phase, {
    v: target,
    duration: 1.1,
    ease: "power2.out",
    onUpdate: draw,
  })
}

// The lunar cycle in the footer, one moon after another
function phases() {
  $$("[data-phases]").forEach((strip) => {
    gsap.from($$(".phase", strip), {
      opacity: 0,
      scale: 0.3,
      rotate: -90,
      duration: 0.6,
      stagger: 0.08,
      ease: "back.out(2)",
      scrollTrigger: {
        trigger: strip,
        start: "top 95%",
        toggleActions: PLAY_ONCE,
      },
    })
  })
}

// The moon by the logo waxes as you read down the page
function progressMoon() {
  const paths = $$<SVGPathElement>("[data-progress-moon] [data-moon]")
  if (!paths.length) return
  const draw = (p: number) =>
    paths.forEach((path) => path.setAttribute("d", moonPath(p)))
  draw(0)
  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => draw(self.progress),
  })
}

// Anything that simply rises into place, once
function reveals() {
  $$("[data-reveal]").forEach((el) => {
    gsap.from(el, {
      y: 36,
      opacity: 0,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top 90%",
        toggleActions: PLAY_ONCE,
      },
    })
  })
  $$("[data-parallax]").forEach((img) => {
    gsap.fromTo(
      img,
      { yPercent: -8, scale: 1.15 },
      {
        yPercent: 8,
        ease: "none",
        scrollTrigger: {
          trigger: img.parentElement,
          start: "top bottom",
          end: "bottom top",
          scrub: SCRUB,
        },
      }
    )
  })
}

// A panel that grows to fill the screen as it arrives
function closingPanel() {
  $$("[data-close]").forEach((panel) => {
    gsap.fromTo(
      panel,
      { scale: 0.86, borderRadius: 48 },
      {
        scale: 1,
        borderRadius: 18,
        ease: "none",
        scrollTrigger: {
          trigger: panel.parentElement,
          start: "top bottom",
          end: "top 20%",
          scrub: SCRUB,
        },
      }
    )
  })
}

// A review page opens with its name rising and its moon filling to the score
function reviewHead() {
  const head = $("[data-review-head]")
  if (!head) return
  const paths = $$<SVGPathElement>("[data-moon]", head)
  const roll = $("[data-roll-score]", head)
  const hasScore = head.dataset.score !== ""
  const target = Number(head.dataset.score ?? 0)
  const state = { v: 0 }
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } })
  tl.fromTo(
    "[data-review-media]",
    { clipPath: "circle(16% at 50% 50%)" },
    { clipPath: "circle(75% at 50% 50%)", duration: 1.4, ease: "expo.inOut" }
  )
  const photo = $("[data-review-media] img", head)
  if (photo) tl.from(photo, { scale: 1.35, duration: 2 }, "<")
  tl.from(
    SplitText.create("[data-review-name]", { type: "words,chars" }).chars,
    { yPercent: 110, duration: 1, stagger: 0.03 },
    "-=1.1"
  )
    .from(
      "[data-review-meta] > *",
      { y: 20, opacity: 0, duration: 0.7, stagger: 0.08, ease: "power3.out" },
      "-=.8"
    )
    .addLabel("moon", "-=.9")
    .to(
      state,
      {
        v: hasScore ? target : 0,
        duration: 1.6,
        ease: "power2.inOut",
        onUpdate: () =>
          paths.forEach((p) => p.setAttribute("d", moonPath(state.v / 10))),
      },
      "moon"
    )
  // The digits roll with the moon instead of jumping from value to value
  if (roll) {
    tl.fromTo(
      roll,
      { "--n": 0 },
      {
        "--n": Number(roll.dataset.whole ?? 0),
        duration: 1.6,
        ease: "power2.inOut",
      },
      "moon"
    )
    const half = $("[data-roll-half]", roll)
    if (half)
      tl.fromTo(
        half,
        { opacity: 0, yPercent: 40 },
        { opacity: 1, yPercent: 0, duration: 0.5, ease: "power3.out" },
        "moon+=1.25"
      )
  }
}

// The cursor dot that grows into a label over anything with data-cursor
function cursor() {
  const el = $("[data-cursor-dot]")
  if (!el || !matchMedia("(hover: hover) and (pointer: fine)").matches) return
  const label = $("span", el)
  const xTo = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3" })
  const yTo = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3" })
  addEventListener("pointermove", (e) => {
    el.style.opacity = "1"
    xTo(e.clientX)
    yTo(e.clientY)
  })
  document.addEventListener("pointerover", (e) => {
    const target = (e.target as Element).closest<HTMLElement>("[data-cursor]")
    el.classList.toggle("is-big", !!target)
    if (target && label) label.textContent = target.dataset.cursor ?? ""
  })
}

export function initMotion() {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
  if (reduce) {
    $("[data-loader]")?.style.setProperty("display", "none")
    // Show the end states the animations would have reached
    $$("[data-moon-scrub]").forEach((s) =>
      $("[data-moon]", s)?.setAttribute("d", moonPath(1))
    )
    $$<SVGSVGElement>("[data-orbit]").forEach((svg) => orbitAt(svg)(1))
    progressMoon()
    const head = $("[data-review-head]")
    if (head)
      $("[data-moon]", head)?.setAttribute(
        "d",
        moonPath(Number(head.dataset.score || 0) / 10)
      )
    return
  }
  const lenis = smoothScroll()
  progressMoon()
  intro(lenis)
  reviewHead()
  words()
  moonScrub()
  travellingType()
  charTitles()
  wipes()
  reveals()
  closingPanel()
  phases()
  cursor()
  // Fonts change line lengths: measure again once they are in
  document.fonts?.ready.then(() => ScrollTrigger.refresh())
}
