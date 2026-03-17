import { useState } from 'react';
import { useFirestoreQuery } from '../hooks/useFirestoreQuery';
import { Category, FamilyMember, Transaction, TransactionType } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Plus, Pencil, Trash2, ArrowUpRight, ArrowDownRight, Search, Filter } from 'lucide-react';
import { addDoc, collection, deleteDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { formatVND, formatDate } from '../lib/utils';
import { format } from 'date-fns';

export default function Transactions() {
  const { currentUser } = useAuth();
  const { data: transactions, loading: txLoading } = useFirestoreQuery<Transaction>('transactions', [orderBy('date', 'desc')]);
  const { data: categories } = useFirestoreQuery<Category>('categories');
  const { data: members } = useFirestoreQuery<FamilyMember>('family_members');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  
  // Form state
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [memberId, setMemberId] = useState('none');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Tiền mặt');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const handleOpenDialog = (tx?: Transaction) => {
    if (tx) {
      setEditingTx(tx);
      setType(tx.type);
      setAmount(tx.amount.toString());
      setCategoryId(tx.categoryId);
      setMemberId(tx.memberId || 'none');
      setDescription(tx.description || '');
      setPaymentMethod(tx.paymentMethod || 'Tiền mặt');
      setDate(tx.date.split('T')[0]);
    } else {
      setEditingTx(null);
      setType('expense');
      setAmount('');
      setCategoryId('');
      setMemberId('none');
      setDescription('');
      setPaymentMethod('Tiền mặt');
      setDate(format(new Date(), 'yyyy-MM-dd'));
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Số tiền không hợp lệ');
      return;
    }
    if (!categoryId) {
      toast.error('Vui lòng chọn danh mục');
      return;
    }

    try {
      const txData = {
        userId: currentUser?.uid,
        type,
        amount: Number(amount),
        categoryId,
        memberId: memberId === 'none' ? '' : memberId,
        description,
        paymentMethod,
        date: new Date(date).toISOString(),
      };

      if (editingTx) {
        await updateDoc(doc(db, 'transactions', editingTx.id), txData);
        toast.success('Cập nhật giao dịch thành công');
      } else {
        await addDoc(collection(db, 'transactions'), {
          ...txData,
          createdAt: new Date().toISOString()
        });
        toast.success('Thêm giao dịch thành công');
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Đã xảy ra lỗi');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) {
      try {
        await deleteDoc(doc(db, 'transactions', id));
        toast.success('Đã xóa giao dịch');
      } catch (error) {
        toast.error('Lỗi khi xóa giao dịch');
      }
    }
  };

  if (txLoading) return <div>Đang tải...</div>;

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesType = filterType === 'all' || tx.type === filterType;
    return matchesSearch && matchesType;
  });

  const getCategory = (id: string) => categories.find(c => c.id === id);
  const getMember = (id: string) => members.find(m => m.id === id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Giao dịch</h1>
          <p className="text-muted-foreground">Quản lý các khoản thu chi của gia đình.</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm giao dịch
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Tìm kiếm giao dịch..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Tất cả loại" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="income">Thu nhập</SelectItem>
              <SelectItem value="expense">Chi tiêu</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Không tìm thấy giao dịch nào.
          </div>
        ) : (
          <div className="divide-y">
            {filteredTransactions.map(tx => {
              const category = getCategory(tx.categoryId);
              const member = tx.memberId ? getMember(tx.memberId) : null;
              const isIncome = tx.type === 'income';

              return (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white`}
                      style={{ backgroundColor: category?.color || (isIncome ? '#10b981' : '#ef4444') }}
                    >
                      {isIncome ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="font-medium text-base">{tx.description || category?.name || 'Giao dịch'}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatDate(tx.date)}</span>
                        <span>•</span>
                        <span className="px-2 py-0.5 rounded-full bg-secondary text-xs">{category?.name}</span>
                        {member && (
                          <>
                            <span>•</span>
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{member.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-semibold text-lg ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {isIncome ? '+' : '-'}{formatVND(tx.amount)}
                    </span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(tx)}>
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(tx.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingTx ? 'Sửa giao dịch' : 'Thêm giao dịch mới'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                type="button" 
                variant={type === 'expense' ? 'default' : 'outline'} 
                className={type === 'expense' ? 'bg-red-500 hover:bg-red-600 text-white' : ''}
                onClick={() => setType('expense')}
              >
                Chi tiêu
              </Button>
              <Button 
                type="button" 
                variant={type === 'income' ? 'default' : 'outline'}
                className={type === 'income' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : ''}
                onClick={() => setType('income')}
              >
                Thu nhập
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Số tiền (VND)</Label>
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
            </div>

            <div className="space-y-2">
              <Label>Danh mục</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.type === type).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                  {categories.filter(c => c.type === type).length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground text-center">Chưa có danh mục nào. Hãy tạo trong phần Danh mục.</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ngày giao dịch</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Mô tả (Tùy chọn)</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Chi tiết giao dịch..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Thành viên (Tùy chọn)</Label>
                <Select value={memberId} onValueChange={setMemberId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn thành viên" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không gán</SelectItem>
                    {members.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Phương thức thanh toán</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tiền mặt">Tiền mặt</SelectItem>
                    <SelectItem value="Chuyển khoản">Chuyển khoản</SelectItem>
                    <SelectItem value="Thẻ tín dụng">Thẻ tín dụng</SelectItem>
                    <SelectItem value="Ví điện tử">Ví điện tử</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave}>Lưu giao dịch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
