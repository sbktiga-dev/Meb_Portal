export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|avi|mkv|m4v)(\?|$)/i.test(url)
    || url.includes('video/')
    || url.includes('youtube.com/embed')
    || url.includes('rutube.ru/embed')
    || url.includes('vk.com/video_ext');
}

export function isEmbedUrl(url: string): boolean {
  return url.includes('youtube.com/embed')
    || url.includes('rutube.ru/embed')
    || url.includes('vk.com/video_ext');
}
