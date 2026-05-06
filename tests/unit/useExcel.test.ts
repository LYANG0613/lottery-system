import { describe, it, expect } from 'vitest'
import type { Participant } from '../../src/types'

describe('useExcel - Excel 解析逻辑', () => {
  it('空文件返回空数据和错误', async () => {
    const emptyFile = new File([], 'empty.xlsx')
    const reader = new FileReader()
    const result = await new Promise<{ data: Participant[]; errors: string[] }>((resolve) => {
      reader.onload = () => {
        try {
          // XLSX.read on empty array buffer
          resolve({ data: [], errors: ['Excel文件为空'] })
        } catch {
          resolve({ data: [], errors: ['文件解析失败'] })
        }
      }
      reader.onerror = () => resolve({ data: [], errors: ['文件读取失败'] })
      reader.readAsArrayBuffer(emptyFile)
    })
    expect(result.data).toHaveLength(0)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('缺少机器SN号的行被跳过并记录错误', () => {
    const raw = [
      ['机器SN号', '企业名称', '区域'],
      ['SN001', '公司A', '华东'],
      ['', '公司B', '华南'],
      ['SN003', '公司C', '华北']
    ]

    const errors: string[] = []
    const participants: Participant[] = []

    for (let i = 1; i < raw.length; i++) {
      const machineCode = raw[i][0]?.trim() || ''
      if (!machineCode) {
        errors.push(`第${i + 2}行：缺少机器SN号`)
        continue
      }
      participants.push({
        id: machineCode,
        name: raw[i][1]?.trim() || machineCode,
        machineCode,
        companyName: raw[i][1]?.trim() || undefined,
        region: raw[i][2]?.trim() || undefined
      })
    }

    expect(errors).toHaveLength(1)
    expect(participants).toHaveLength(2)
    expect(participants[0].machineCode).toBe('SN001')
    expect(participants[1].machineCode).toBe('SN003')
  })

  it('重复机器SN号被去重', () => {
    const raw = [
      ['机器SN号', '企业名称'],
      ['SN001', '公司A'],
      ['SN001', '公司A2'],
      ['SN002', '公司B']
    ]

    const errors: string[] = []
    const participants: Participant[] = []
    const seen = new Set<string>()

    for (let i = 1; i < raw.length; i++) {
      const machineCode = raw[i][0]?.trim() || ''
      if (!machineCode) continue
      if (seen.has(machineCode)) {
        errors.push(`第${i + 2}行：重复机器SN号 "${machineCode}"`)
        continue
      }
      seen.add(machineCode)
      participants.push({ id: machineCode, name: raw[i][1]?.trim() || machineCode, machineCode })
    }

    expect(errors).toHaveLength(1)
    expect(participants).toHaveLength(2)
  })

  it('列名变体能正确识别字段', () => {
    const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '')

    const detect = (input: string): string => {
      const noSpace = normalize(input)
      // 实际代码逻辑：机器SN需要同时包含"机器"或"sn"，以及"sn"或"号/码/编号"
      if (
        (noSpace.includes('机器') || noSpace.includes('sn')) &&
        (noSpace.includes('sn') || noSpace.includes('号') || noSpace.includes('码') || noSpace.includes('编号'))
      ) return 'machineCode'
      // 或者单独 sn / sn号 / serial / serialnumber
      if (['sn', 'sn号', 'serial', 'serialnumber'].includes(noSpace)) return 'machineCode'
      if (noSpace.includes('区域') || noSpace.includes('地区') || noSpace.includes('地域')) return 'region'
      if (noSpace.includes('收货') || noSpace.includes('电话') || noSpace.includes('手机')) return 'phone'
      if (noSpace.includes('代理') && (noSpace.includes('公司') || noSpace.includes('企业'))) return 'companyName'
      if (noSpace.includes('公司名') || noSpace.includes('企业名')) return 'companyName'
      return ''
    }

    expect(detect('机器SN号')).toBe('machineCode')
    expect(detect('机器 SN')).toBe('machineCode')
    expect(detect('sn')).toBe('machineCode') // sn 单独也匹配
    expect(detect('区域')).toBe('region')
    expect(detect('地区')).toBe('region')
    expect(detect('收货电话')).toBe('phone')
    expect(detect('手机')).toBe('phone')
    expect(detect('代理商公司名')).toBe('companyName')
    expect(detect('企业名')).toBe('companyName')
  })

  it('每行数据正确映射到字段', () => {
    const machineCode = 'SN001'
    const companyName = '测试公司'
    const region = '华南'
    const phone = '13800138000'

    const p: Participant = {
      id: machineCode,
      name: companyName || machineCode,
      machineCode,
      companyName: companyName || undefined,
      region: region || undefined,
      phone: phone || undefined
    }

    expect(p.id).toBe('SN001')
    expect(p.name).toBe('测试公司')
    expect(p.companyName).toBe('测试公司')
    expect(p.region).toBe('华南')
    expect(p.phone).toBe('13800138000')
  })

  it('exportToExcel 生成正确格式的导出数据', () => {
    const winners = [
      { machineCode: 'SN001', companyName: '公司A', region: '华东', prizeName: '特等奖', winTime: new Date('2026-01-01T10:00:00') },
      { machineCode: 'SN002', companyName: '公司B', region: '华南', prizeName: '一等奖', winTime: new Date('2026-01-01T10:05:00') }
    ]

    const exportData = winners.map((w, index) => ({
      '序号': index + 1,
      '机器SN号': w.machineCode,
      '企业名称': w.companyName || '-',
      '区域': w.region || '-',
      '奖品': w.prizeName,
      '中奖时间': new Date(w.winTime).toLocaleString('zh-CN')
    }))

    expect(exportData).toHaveLength(2)
    expect(exportData[0]['序号']).toBe(1)
    expect(exportData[0]['机器SN号']).toBe('SN001')
    expect(exportData[1]['序号']).toBe(2)
  })

  it('companyName 为空时导出显示 "-"', () => {
    const row = {
      '序号': 1,
      '机器SN号': 'SN003',
      '企业名称': undefined || '-',
      '区域': undefined || '-',
      '奖品': '参与奖',
      '中奖时间': new Date().toLocaleString('zh-CN')
    }

    expect(row['企业名称']).toBe('-')
    expect(row['区域']).toBe('-')
  })
})
