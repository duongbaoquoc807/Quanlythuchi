import { useState } from 'react';
import { signInWithGoogle } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Wallet } from 'lucide-react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithGoogle();
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Family Finance Manager</CardTitle>
          <CardDescription>Quản lý tài chính gia đình thông minh</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
              {error}
            </div>
          )}
          <Button className="w-full h-12 text-base" onClick={handleGoogleLogin} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đăng nhập bằng Google'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
