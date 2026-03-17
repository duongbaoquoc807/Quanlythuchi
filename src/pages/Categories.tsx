import { useState } from 'react';
import { useFirestoreQuery } from '../hooks/useFirestoreQuery';
import { Category, TransactionType } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';

export default function Categories() {
  const { currentUser } = useAuth();
  const { data: categories, loading } = useFirestoreQuery<Category>('categories');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [color, setColor] = useState('#3b82f6');

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setType(category.type);
      setColor(category.color || '#3b82f6');
    } else {
      setEditingCategory(null);
      setName('');
      setType('expense');
      setColor('#3b82f6');
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }

    try {
      if (editingCategory) {
        await updateDoc(doc(db, 'categories', editingCategory.id), {
          name,
          type,
          color,
        });
        toast.success('Cập nhật danh mục thành công');
      } else {
        await addDoc(collection(db, 'categories'), {
          userId: currentUser?.uid,
          name,
          type,
          color,
          icon: 'tag',
          createdAt: new Date().toISOString()
        });
        toast.success('Thêm danh mục thành công');
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Đã xảy ra lỗi');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      try {
        await deleteDoc(doc(db, 'categories', id));
        toast.success('Đã xóa danh mục');
      } catch (error) {
        toast.error('Lỗi khi xóa danh mục');
      }
    }
  };

  if (loading) return <div>Đang tải...</div>;

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  const renderCategoryList = (list: Category[], title: string) => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {list.length === 0 ? (
        <p className="text-muted-foreground text-sm">Chưa có danh mục nào.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map(category => (
            <Card key={category.id} className="overflow-hidden">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: category.color || '#ccc' }}
                  >
                    <Tag className="w-5 h-5" />
                  </div>
                  <span className="font-medium">{category.name}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(category)}>
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(category.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Danh mục</h1>
          <p className="text-muted-foreground">Quản lý các phân loại thu chi.</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm danh mục
        </Button>
      </div>

      <div className="space-y-8">
        {renderCategoryList(expenseCategories, 'Danh mục Chi tiêu')}
        {renderCategoryList(incomeCategories, 'Danh mục Thu nhập')}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tên danh mục</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ví dụ: Ăn uống, Lương..." />
            </div>
            <div className="space-y-2">
              <Label>Loại</Label>
              <Select value={type} onValueChange={(v: TransactionType) => setType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Chi tiêu</SelectItem>
                  <SelectItem value="income">Thu nhập</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Màu sắc</Label>
              <div className="flex gap-2">
                <Input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-16 h-10 p-1" />
                <Input type="text" value={color} onChange={e => setColor(e.target.value)} className="flex-1" />
              </div>
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
