import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { logOut } from '../lib/firebase';
import { LogOut, User, Mail, Shield } from 'lucide-react';

export default function Settings() {
  const { currentUser } = useAuth();

  const handleLogout = async () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      await logOut();
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cài đặt</h1>
        <p className="text-muted-foreground">Quản lý tài khoản và tùy chọn ứng dụng.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin tài khoản</CardTitle>
          <CardDescription>Thông tin cá nhân được đồng bộ từ tài khoản Google của bạn.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
              {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="text-lg font-medium">{currentUser?.displayName || 'Người dùng'}</h3>
              <p className="text-muted-foreground">{currentUser?.email}</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Tên hiển thị
              </Label>
              <Input value={currentUser?.displayName || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input value={currentUser?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                ID Người dùng
              </Label>
              <Input value={currentUser?.uid || ''} disabled type="password" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-red-500">Khu vực nguy hiểm</CardTitle>
          <CardDescription>Các hành động không thể hoàn tác.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleLogout} className="w-full sm:w-auto">
            <LogOut className="w-4 h-4 mr-2" />
            Đăng xuất khỏi thiết bị này
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
