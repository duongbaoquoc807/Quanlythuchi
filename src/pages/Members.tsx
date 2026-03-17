import { useState } from 'react';
import { useFirestoreQuery } from '../hooks/useFirestoreQuery';
import { FamilyMember } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Plus, Pencil, Trash2, User } from 'lucide-react';
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';

export default function Members() {
  const { currentUser } = useAuth();
  const { data: members, loading } = useFirestoreQuery<FamilyMember>('family_members');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  
  const [name, setName] = useState('');
  const [role, setRole] = useState('Thành viên');

  const handleOpenDialog = (member?: FamilyMember) => {
    if (member) {
      setEditingMember(member);
      setName(member.name);
      setRole(member.role || 'Thành viên');
    } else {
      setEditingMember(null);
      setName('');
      setRole('Thành viên');
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên thành viên');
      return;
    }

    try {
      if (editingMember) {
        await updateDoc(doc(db, 'family_members', editingMember.id), {
          name,
          role,
        });
        toast.success('Cập nhật thành công');
      } else {
        await addDoc(collection(db, 'family_members'), {
          userId: currentUser?.uid,
          name,
          role,
          createdAt: new Date().toISOString()
        });
        toast.success('Thêm thành viên thành công');
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Đã xảy ra lỗi');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thành viên này?')) {
      try {
        await deleteDoc(doc(db, 'family_members', id));
        toast.success('Đã xóa thành viên');
      } catch (error) {
        toast.error('Lỗi khi xóa thành viên');
      }
    }
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Thành viên gia đình</h1>
          <p className="text-muted-foreground">Quản lý những người tham gia chi tiêu.</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm thành viên
        </Button>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-12 border rounded-xl bg-card">
          <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Chưa có thành viên nào</h3>
          <p className="text-muted-foreground mb-4">Thêm thành viên để theo dõi chi tiêu cá nhân.</p>
          <Button onClick={() => handleOpenDialog()}>Thêm ngay</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map(member => (
            <Card key={member.id} className="overflow-hidden">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(member)}>
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(member.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMember ? 'Sửa thông tin' : 'Thêm thành viên mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tên thành viên</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ví dụ: Vợ, Chồng, Con trai..." />
            </div>
            <div className="space-y-2">
              <Label>Vai trò / Ghi chú</Label>
              <Input value={role} onChange={e => setRole(e.target.value)} placeholder="Ví dụ: Vợ, Chồng..." />
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
