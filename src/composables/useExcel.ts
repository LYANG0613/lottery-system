import * as XLSX from 'xlsx'
import type { Participant, ExcelRow } from '../types'

export interface ExcelImportResult {
  data: Participant[]
  errors: string[]
}

function findFieldMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}

  headers.forEach((header) => {
    const normalized = header.trim().toLowerCase()
    const noSpace = normalized.replace(/\s+/g, '')

    // 机器SN号
    if (!mapping['machineCode']) {
      if (
        (noSpace.includes('机器') || noSpace.includes('sn')) &&
        (noSpace.includes('sn') || noSpace.includes('号') || noSpace.includes('码') || noSpace.includes('编号'))
      ) {
        mapping['machineCode'] = header
      } else if (['sn', 'sn号', 'serial', 'serialnumber'].includes(noSpace)) {
        mapping['machineCode'] = header
      }
    }

    // 代理商公司名
    if (!mapping['companyName']) {
      if (noSpace.includes('代理') && (noSpace.includes('公司') || noSpace.includes('企业'))) {
        mapping['companyName'] = header
      } else if (noSpace.includes('公司名') || noSpace.includes('企业名')) {
        mapping['companyName'] = header
      }
    }

    // 区域
    if (!mapping['region']) {
      if (noSpace.includes('区域') || noSpace.includes('地区') || noSpace.includes('地域')) {
        mapping['region'] = header
      }
    }

    // 收货信息/电话
    if (!mapping['phone']) {
      if (noSpace.includes('收货') || noSpace.includes('电话') || noSpace.includes('手机')) {
        mapping['phone'] = header
      }
    }
  })

  return mapping
}

export function parseExcel(file: File): Promise<ExcelImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    const errors: string[] = []

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'array', cellDates: true })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        // 获取所有原始数据（包含表头行）
        const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })

        if (rawData.length === 0) {
          resolve({ data: [], errors: ['Excel文件为空'] })
          return
        }

        // 找到包含表头的行
        let headerRowIndex = 0
        let foundHeaders = false

        for (let i = 0; i < Math.min(rawData.length, 5); i++) {
          const row = rawData[i]
          const rowStr = row.map((c: any) => String(c).toLowerCase()).join('')

          if (rowStr.includes('机器') || rowStr.includes('sn')) {
            headerRowIndex = i
            foundHeaders = true
            break
          }
        }

        if (!foundHeaders) {
          headerRowIndex = 0
        }

        const headers = rawData[headerRowIndex].map((h: any) => String(h || ''))
        const fieldMapping = findFieldMapping(headers)

        // 如果没有找到机器SN号映射，使用第一列
        if (!fieldMapping['machineCode'] && headers.length > 0) {
          fieldMapping['machineCode'] = headers[0]
          errors.push('未检测到机器SN号列，默认使用第一列')
        }

        const participants: Participant[] = []
        const seenMachineCodes = new Set<string>()

        // 从表头下一行开始读取数据
        for (let index = headerRowIndex + 1; index < rawData.length; index++) {
          const row = rawData[index]
          const rowObj: ExcelRow = {}
          headers.forEach((header, colIndex) => {
            rowObj[header] = row[colIndex]
          })

          const machineCode = fieldMapping['machineCode']
            ? String(rowObj[fieldMapping['machineCode']] || '').trim()
            : ''

          if (!machineCode) {
            errors.push(`第${index + 2}行：缺少机器SN号`)
            continue
          }

          const companyName = fieldMapping['companyName']
            ? String(rowObj[fieldMapping['companyName']] || '').trim()
            : ''

          const region = fieldMapping['region']
            ? String(rowObj[fieldMapping['region']] || '').trim()
            : ''

          const phone = fieldMapping['phone']
            ? String(rowObj[fieldMapping['phone']] || '').trim()
            : ''

          const participant: Participant = {
            id: machineCode,
            name: companyName || machineCode,
            machineCode: machineCode,
            companyName: companyName || undefined,
            region: region || undefined,
            phone: phone || undefined
          }

          if (seenMachineCodes.has(machineCode)) {
            errors.push(`第${index + 2}行：重复机器SN号 "${machineCode}"`)
            continue
          }
          seenMachineCodes.add(machineCode)

          participants.push(participant)
        }

        resolve({ data: participants, errors })
      } catch (error) {
        resolve({ data: [], errors: ['文件解析失败，请确保是有效的Excel文件'] })
      }
    }

    reader.onerror = () => {
      resolve({ data: [], errors: ['文件读取失败'] })
    }

    reader.readAsArrayBuffer(file)
  })
}

export function exportToExcel(
  winners: Array<{
    machineCode: string
    companyName?: string
    region?: string
    prizeName: string
    winTime: Date
  }>,
  filename: string = '获奖名单'
): void {
  const exportData = winners.map((w, index) => ({
    '序号': index + 1,
    '机器SN号': w.machineCode,
    '企业名称': w.companyName || '-',
    '区域': w.region || '-',
    '奖品': w.prizeName,
    '中奖时间': new Date(w.winTime).toLocaleString('zh-CN')
  }))

  const worksheet = XLSX.utils.json_to_sheet(exportData)

  const colWidths = [
    { wch: 6 },
    { wch: 18 },
    { wch: 30 },
    { wch: 15 },
    { wch: 20 },
    { wch: 25 }
  ]
  worksheet['!cols'] = colWidths

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '获奖名单')

  const date = new Date().toISOString().split('T')[0]
  XLSX.writeFile(workbook, `${filename}_${date}.xlsx`)
}
