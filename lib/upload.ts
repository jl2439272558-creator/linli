/** 客户端上传商品图片：返回可持久访问的 URL，失败时抛出带中文说明的错误 */
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const resp = await fetch('/api/upload', { method: 'POST', body: form })
  if (resp.status === 401) {
    window.location.href = '/login'
    throw new Error('登录已过期')
  }
  const data = await resp.json().catch(() => ({}))
  if (!resp.ok || !data.ok) throw new Error(data.error || `上传失败（HTTP ${resp.status}）`)
  return data.url as string
}

/** 触发文件选择并上传，统一校验提示；返回 null 表示用户取消 */
export async function pickAndUploadImage(accept = 'image/jpeg,image/png,image/webp'): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }
      try {
        resolve(await uploadImage(file))
      } catch (err) {
        reject(err)
      }
    }
    input.click()
  })
}
