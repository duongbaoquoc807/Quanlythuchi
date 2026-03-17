import { useState } from 'react';
import { useFirestoreQuery } from '../hooks/useFirestoreQuery';
import { Transaction, Category, FamilyMember } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Download, PieChart as PieChartIcon, BarChart as BarChartIcon } from 'lucide-react';
import { formatVND, formatDate } from '../lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import * as Papa from 'papaparse';

export default function Reports() {
  const { data: transactions, loading: txLoading } = useFirestoreQuery<Transaction>('transactions');
  const { data: categories } = useFirestoreQuery<Category>('categories');
  const { data: members } = useFirestoreQuery<FamilyMember>('family_members');

  const [timeRange, setTimeRange] = useState('thisMonth');
  const [reportType, setReportType] = useState('category'); // 'category' or 'member'

  if (txLoading) return <div>Đang tải...</div>;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const filteredTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    if (timeRange === 'thisMonth') {
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    }
    if (timeRange === 'lastMonth') {
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const year = currentMonth === 0 ? currentYear - 1 : currentYear;
      return txDate.getMonth() === lastMonth && txDate.getFullYear() === year;
    }
    if (timeRange === 'thisYear') {
      return txDate.getFullYear() === currentYear;
    }
    return true; // 'all'
  });

  const totalIncome = filteredTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpense = filteredTransactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);

  // Prepare data for Pie Chart
  let pieData: any[] = [];
  if (reportType === 'category') {
    const expensesByCategory = filteredTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((acc, tx) => {
        const category = categories.find(c => c.id === tx.categoryId);
        const name = category ? category.name : 'Khác';
        const color = category ? category.color : '#ccc';
        if (!acc[name]) acc[name] = { name, value: 0, color };
        acc[name].value += tx.amount;
        return acc;
      }, {} as Record<string, { name: string, value: number, color: string }>);
    pieData = Object.values(expensesByCategory).sort((a, b) => b.value - a.value);
  } else {
    const expensesByMember = filteredTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((acc, tx) => {
        const member = members.find(m => m.id === tx.memberId);
        const name = member ? member.name : 'Chung';
        if (!acc[name]) acc[name] = { name, value: 0, color: `#${Math.floor(Math.random()*16777215).toString(16)}` };
        acc[name].value += tx.amount;
        return acc;
      }, {} as Record<string, { name: string, value: number, color: string }>);
    pieData = Object.values(expensesByMember).sort((a, b) => b.value - a.value);
  }

  const handleExportCSV = () => {
    const exportData = filteredTransactions.map(tx => {
      const category = categories.find(c => c.id === tx.categoryId);
      const member = members.find(m => m.id === tx.memberId);
      return {
        'Ngày': formatDate(tx.date),
        'Loại': tx.type === 'income' ? 'Thu nhập' : 'Chi tiêu',
        'Danh mục': category?.name || 'Khác',
        'Số tiền': tx.amount,
        'Thành viên': member?.name || 'Chung',
        'Mô tả': tx.description || '',
        'Phương thức': tx.paymentMethod || ''
      };
    });

    const csv = Papa.unparse(exportData);
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel UTF-8
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bao_cao_thu_chi_${timeRange}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Báo cáo</h1>
          <p className="text-muted-foreground">Phân tích chi tiết tình hình tài chính.</p>
        </div>
        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-2" />
          Xuất CSV
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-48">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger>
              <SelectValue placeholder="Thời gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisMonth">Tháng này</SelectItem>
              <SelectItem value="lastMonth">Tháng trước</SelectItem>
              <SelectItem value="thisYear">Năm nay</SelectItem>
              <SelectItem value="all">Tất cả thời gian</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-48">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger>
              <SelectValue placeholder="Phân tích theo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="category">Theo danh mục</SelectItem>
              <SelectItem value="member">Theo thành viên</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tổng quan Thu Chi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                <span className="font-medium text-emerald-700 dark:text-emerald-400">Tổng thu</span>
                <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{formatVND(totalIncome)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900/50">
                <span className="font-medium text-red-700 dark:text-red-400">Tổng chi</span>
                <span className="text-xl font-bold text-red-700 dark:text-red-400">{formatVND(totalExpense)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg border border-primary/10">
                <span className="font-medium">Số dư</span>
                <span className={`text-xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-primary' : 'text-red-500'}`}>
                  {formatVND(totalIncome - totalExpense)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cơ cấu chi tiêu {reportType === 'category' ? 'theo danh mục' : 'theo thành viên'}</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => formatVND(value)} />
                    <Legend layout="vertical" verticalAlign="middle" align="right" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Không có dữ liệu chi tiêu trong khoảng thời gian này.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chi tiết chi tiêu</CardTitle>
        </CardHeader>
        <CardContent>
          {pieData.length > 0 ? (
            <div className="space-y-4">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">{formatVND(item.value)}</span>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {((item.value / totalExpense) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">Không có dữ liệu</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
