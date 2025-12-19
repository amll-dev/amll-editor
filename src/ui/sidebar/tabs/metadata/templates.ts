export interface MetadataTemplate {
  name: string
  fields: {
    key: string
    label: string
    discription?: string
    validation?: {
      validator: (s: string) => boolean
      message: string
      severity: 'error' | 'warning'
    }
  }[]
  docUrl?: string
}

export const lrcMetaTemplate = {
  name: 'LRC 元数据模板',
  fields: [
    { key: 'ti', label: '标题' },
    { key: 'ar', label: '艺术家' },
    { key: 'al', label: '专辑' },
    { key: 'au', label: '作者' },
    { key: 'lr', label: '作词' },
    {
      key: 'length',
      label: '音频长度',
      validation: {
        validator: (s) => /^\d{1,2}:\d{1,2}(\.\d{1,3})?$/.test(s),
        message: '长度格式应为 mm:ss 或 mm:ss.sss',
        severity: 'error',
      },
    },
    { key: 'by', label: '歌词文件创建者' },
    { key: 're', label: '歌词文件创建工具' },
  ],
  docUrl: 'https://en.wikipedia.org/wiki/LRC_(file_format)',
} as const satisfies MetadataTemplate

export const amllMetaTemplate = {
  name: 'AMLL TTML 元数据模板',
  fields: [
    { key: 'musicName', label: '歌曲名称' },
    { key: 'artists', label: '艺术家' },
    { key: 'album', label: '专辑名' },
    { key: 'ncmMusicId', label: '网易云音乐 ID' },
    { key: 'qqMusicId', label: 'QQ 音乐 ID' },
    { key: 'spotifyId', label: 'Spotify 音乐 ID' },
    { key: 'appleMusicId', label: 'Apple Music 音乐 ID' },
    { key: 'isrc', label: 'ISRC 号' },
    { key: 'ttmlAuthorGithub', label: 'TTML 作者 GitHub UID' },
    { key: 'ttmlAuthorGithubLogin', label: 'TTML 作者 GitHub 用户名' },
  ],
  docUrl:
    'https://github.com/Steve-xmh/amll-ttml-tool/wiki/%E6%AD%8C%E8%AF%8D%E5%85%83%E6%95%B0%E6%8D%AE',
} as const satisfies MetadataTemplate
