import XLSX from 'xlsx';

// Excel文件路径
const filePath = '/Users/liuyang/Downloads/抽奖测试.xls';

// 读取文件 - XLS格式需要特殊处理
const workbook = XLSX.readFile(filePath, { type: 'array' });

// 获取第一个工作表
const firstSheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[firstSheetName];

// 转换为JSON数组
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('='.repeat(60));
console.log('Excel 文件读取结果');
console.log('='.repeat(60));

// 1. 获取列名（headers）- 表头在第2行（索引1）
const headers = data[1] || [];
console.log('\n📋 1. 所有列名（Headers）:');
console.log('-'.repeat(40));
headers.forEach((header, index) => {
  console.log(`  列 ${index + 1}: ${header}`);
});

// 2. 前5行数据样本 - 数据从第3行（索引2）开始
console.log('\n📊 2. 前5行数据样本:');
console.log('-'.repeat(40));
const rowsToShow = Math.min(5, data.length - 2);
for (let i = 2; i < 2 + rowsToShow; i++) {
  const row = data[i] || [];
  console.log(`\n  第 ${i - 1} 行:`);
  headers.forEach((header, index) => {
    console.log(`    ${header}: ${row[index] ?? '(空)'}`);
  });
}

// 3. 总行数
const totalRows = data.length - 2; // 减去空行和表头行
console.log('\n📈 3. 总行数统计:');
console.log('-'.repeat(40));
console.log(`  总行数（含表头）: ${data.length}`);
console.log(`  数据行数（不含表头）: ${totalRows}`);

console.log('\n' + '='.repeat(60));
