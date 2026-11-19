[![Edit on Hanzo](https://hanzo.ai/badges/edit-on-hanzo.svg)](https://hanzo.app/dev?repo=https%3A%2F%2Fgithub.com%2FMajorDream444%2FMAIM_ABC_STUDIO)

# MAIM ABC Studio: motion campaign source

This repo holds the code for six coordinated vertical motion promos (1080×1920, 30 fps) for **Major Artificial Intelligence Mindset (MAIM)** and the **MAIM Academy Founding Cohort**. They are built with Remotion, React and three.js. All text is composited in code, and all sound is synthesised in code.

| Film | Composition | Idea |
|---|---|---|
| A | `A-ThinkingPool` | Awareness enters by the steps, Belief by the ladder, Context from the depth: different ways into one mindset |
| B | `B-Awareness` | A scatter of tasks resolves into a loop that keeps returning to one point |
| C | `C-Belief` | A wall that looks solid turns out to be two panels, with a way through |
| D | `D-Context` | A pull-back from a stalled task shows what surrounds it |
| E | `E-ThinkBuild` | MAIM → Academy: inquiry → intake → drafted reply → human approval |
| F | `F-Cohort` / `F-Cohort-Evergreen` | The founding cohort invitation (dated and evergreen versions) |

The rendered previews are **not** stored here. This repo is public, and the previews are unpublished and still awaiting approval.

Render instructions are in [RENDER.md](RENDER.md). In short:

```
npm ci
scripts/export.sh F-Cohort F MAIM_F_founding-cohort_dated
```

Status: preview. Nothing in this repo is approved for publication.
