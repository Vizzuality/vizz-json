import { Slide, SlideCode, SlideHeading, SlideText } from '../slide-parts'

const BEFORE = `{
  "circle-opacity": 0.8,
  "circle-color": "#d7191c",
  "circle-radius": 16
}`

const AFTER = `{
  "circle-opacity": "@@#params.opacity",
  "circle-color": "@@#params.color",
  "circle-radius": "@@#params.radius"
}`

export function WhatIfSlide() {
  return (
    <Slide className="items-start">
      <SlideHeading className="mb-8 text-foreground">What if...</SlideHeading>
      <SlideText className="mb-8 text-muted-foreground">
        ...the JSON could reference runtime parameters?
      </SlideText>

      <div className="grid w-full gap-6 md:grid-cols-2">
        <div>
          <p className="mb-3 text-sm font-semibold text-muted-foreground">
            Before
          </p>
          <SlideCode value={BEFORE} />
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-primary">After</p>
          <SlideCode value={AFTER} />
        </div>
      </div>
    </Slide>
  )
}
