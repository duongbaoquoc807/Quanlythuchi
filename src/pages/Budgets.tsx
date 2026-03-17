import { useState } from 'react';
import { useFirestoreQuery } from '../hooks/useFirestoreQuery';
import { Budget, Category, Transaction } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { formatVND } from '../lib/utils';

export default function Budgets() {
  const { currentUser } = useAuth();
  const { data: budgets, loading: budgetLoading } = useFirestoreQuery<Budget>('budgets');
  const { data: categories } = useFirestoreQuery<Category>('categories');
  const { data: transactions } = useFirestoreQuery<Transaction>('transactions');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [categoryId, setCategoryId] = useState('');
  const [month, setMonth] = useState(currentMonth.toString());
  const [year, setYear] = useState(currentYear.toString());
  const [limitAmount, setLimitAmount] = useState('');

  const handleOpenDialog = (budget?: Budget) => {
    if (budget) {
      setEditingBudget(budget);
      setCategoryId(budget.categoryId);
      setMonth(budget.month.toString());
      setYear(budget.year.toString());
      setLimitAmount(budget.limitAmount.toString());
    } else {
      setEditingBudget(null);
      setCategoryId('');
      setMonth(currentMonth.toString());
      setYear(currentYear.toString());
      setLimitAmount('');
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!categoryId) {
      toast.error('Vui lòng chọn danh mục');
      return;
    }
    if (!limitAmount || isNaN(Number(limitAmount)) || Number(limitAmount) <= 0) {
      toast.error('Số tiền không hợp lệ');
      return;
    }

    try {
      const budgetData = {
        userId: currentUser?.uid,
        categoryId,
        month: Number(month),
        year: Number(year),
        limitAmount: Number(limitAmount),
      };

      if (editingBudget) {
        await updateDoc(doc(db, 'budgets', editingBudget.id), budgetData);
        toast.success('Cập nhật ngân sách thành công');
      } else {
        // Check if budget already exists for this category and month/year
        const exists = budgets.find(b => b.categoryId === categoryId && b.month === Number(month) && b.year === Number(year));
        if (exists) {
          toast.error('Ngân sách cho danh mục này trong tháng đã tồn tại');
          return;
        }

        await addDoc(collection(db, 'budgets'), {
          ...budgetData,
          createdAt: new Date().toISOString()
        });
        toast.success('Thêm ngân sách thành công');
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Đã xảy ra lỗi');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa ngân sách này?')) {
      try {
        await deleteDoc(doc(db, 'budgets', id));
        toast.success('Đã xóa ngân sách');
      } catch (error) {
        toast.error('Lỗi khi xóa ngân sách');
      }
    }
  };

  if (budgetLoading) return <div>Đang tải...</div>;

  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ngân sách</h1>
          <p className="text-muted-foreground">Thiết lập và theo dõi hạn mức chi tiêu.</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm ngân sách
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {budgets.length === 0 ? (
          <div className="col-span-full text-center py-12 border rounded-xl bg-card">
            <h3 className="text-lg font-medium">Chưa có ngân sách nào</h3>
            <p className="text-muted-foreground mb-4">Tạo ngân sách để kiểm soát chi tiêu tốt hơn.</p>
            <Button onClick={() => handleOpenDialog()}>Tạo ngay</Button>
          </div>
        ) : (
          budgets.map(budget => {
            const category = categories.find(c => c.id === budget.categoryId);
            
            // Calculate spent amount for this budget
            const spent = transactions
              .filter(tx => 
                tx.categoryId === budget.categoryId && 
                new Date(tx.date).getMonth() + 1 === budget.month &&
                new Date(tx.date).getFullYear() === budget.year
              )
              .reduce((sum, tx) => sum + tx.amount, 0);

            const progress = Math.min((spent / budget.limitAmount) * 100, 100);
            const isOver = spent > budget.limitAmount;
            const isWarning = progress >= 80 && !isOver;

            return (
              <Card key={budget.id} className="overflow-hidden">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category?.color || '#ccc' }} />
                    {category?.name || 'Danh mục đã xóa'}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(budget)}>
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(budget.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-4">
                    Tháng {budget.month}/{budget.year}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{formatVND(spent)}</span>
                      <span className="text-muted-foreground">{formatVND(budget.limitAmount)}</span>
                    </div>
                    
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${isOver ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-xs">
                      <span className={isOver ? 'text-red-500 font-medium flex items-center gap-1' : 'text-muted-foreground'}>
                        {isOver && <AlertCircle className="w-3 h-3" />}
                        {isOver ? `Vượt ${formatVND(spent - budget.limitAmount)}` : `Đã dùng ${progress.toFixed(0)}%`}
                      </span>
                      <span className="text-muted-foreground">
                        Còn lại {formatVND(Math.max(0, budget.limitAmount - spent))}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBudget ? 'Sửa ngân sách' : 'Thêm ngân sách mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Danh mục chi tiêu</Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={!!editingBudget}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                  {expenseCategories.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground text-center">Chưa có danh mục chi tiêu nào.</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tháng</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>Tháng {i + 1}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Năm</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                      <SelectItem key={y} value={y.toString()}>Năm {y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Hạn mức (VND)</Label>
              <Input type="number" value={limitAmount} onChange={e => setLimitAmount(e.target.value)} placeholder="Ví dụ: 5000000" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
