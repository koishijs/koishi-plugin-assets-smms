import { Assets, Context, Quester, Schema } from 'koishi'
import FormData from 'form-data'

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

  async upload(url: string, file: string) {
    const { buffer, filename } = await this.analyze(url, file)
    const payload = new FormData()
    payload.append('smfile', buffer, filename)
    const data = await this.http.post('/upload', payload, { headers: payload.getHeaders() })
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
    token: Schema.string().description('sm.ms 的访问令牌。').role('secret').required(),
  })
}

export default SmmsAssets
