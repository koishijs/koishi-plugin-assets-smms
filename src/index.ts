import { Assets, Context, Schema, Quester } from 'koishi'
import { createHash } from 'crypto'
import FormData from 'form-data'

declare module 'koishi' {
  interface Modules {
    'assets-smms': typeof import('.')
  }
}

export const schema = Schema.object({
  token: Schema.string('sm.ms 的访问令牌。').required(),
})

interface Config {
  token: string
}

class SmmsAssets extends Assets {
  types = ['image']

  http: Quester

  constructor(ctx: Context, public config: Config) {
    super(ctx)
    this.http = ctx.http.extend({
      endpoint: 'https://sm.ms/api/v2',
      headers: { authorization: config.token },
    })
  }

  async upload(url: string, file: string) {
    const buffer = await this.download(url)
    const payload = new FormData()
    payload.append('smfile', buffer, file || createHash('sha1').update(buffer).digest('hex'))
    const data = await this.http('POST', '/upload', payload, payload.getHeaders())
    if (data.code === 'image_repeated') {
      return data.images
    }
    if (!data.data) {
      const error = new Error(data.message)
      return Object.assign(error, data)
    }
    return data.data.url
  }

  async stats() {
    const data = await this.http('POST', '/profile')
    return {
      assetSize: data.data.disk_usage_raw,
    }
  }
}

export const name = 'smms'

export function apply(ctx: Context, config: Config) {
  ctx.assets = new SmmsAssets(ctx, config)
}
