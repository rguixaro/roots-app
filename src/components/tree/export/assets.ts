'use client'

const waitForFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

const waitForImage = (image: HTMLImageElement) => {
  if (image.complete && image.naturalWidth > 0) return Promise.resolve()

  return new Promise<void>((resolve) => {
    const timeout = window.setTimeout(resolve, 10_000)
    const done = () => {
      window.clearTimeout(timeout)
      resolve()
    }

    image.addEventListener('load', done, { once: true })
    image.addEventListener('error', done, { once: true })
  })
}

const decodeImage = async (image: HTMLImageElement) => {
  if (!image.decode) {
    await waitForImage(image)
    return
  }

  try {
    await image.decode()
  } catch {
    await waitForImage(image)
  }
}

async function waitForPictureLoaders(element: HTMLElement) {
  const startedAt = performance.now()

  while (element.querySelector("[data-picture-loader='true']")) {
    if (performance.now() - startedAt > 5_000) return
    await wait(100)
  }
}

export async function waitForTreeExportAssets(element: HTMLElement): Promise<void> {
  await document.fonts?.ready
  await waitForFrame()
  await waitForFrame()

  const images = Array.from(element.querySelectorAll('img'))
  await Promise.all(images.map(decodeImage))

  await waitForPictureLoaders(element)
  await waitForFrame()
}
