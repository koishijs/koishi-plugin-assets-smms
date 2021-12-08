import { Assets, Context, Quester, Schema } from 'koishi'
import { createHash } from 'crypto'
import FormData from 'form-data'

declare module 'koishi' {
  interface Modules {
    'assets-smms': typeof import('.')
  }
}

class SmmsAssets extends Assets {
  types = ['image']

  http: Quester

  constructor(ctx: Context, public config: SmmsAssets.Config) {
    super(ctx)
    this.http = ctx.http.extend({
      endpoint: 'https://sm.ms/api/v2',
      headers: { authorization: config.token },
    })
  }

  start() {}

  stop() {}

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

namespace SmmsAssets {
  export interface Config {
    token: string
  }

  export const Config = Schema.object({
    token: Schema.string().description('sm.ms 的访问令牌。').required(),
  })
}

export default SmmsAssets
