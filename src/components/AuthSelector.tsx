import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { LogIn, Building2, User, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const AuthSelector: React.FC = () => {
  const { user, loginWithGoogle, validateInviteCode, setProfileType, linkUserToInstitution } = useAuth();
  const [step, setStep] = useState<'choice' | 'institutional'>('choice');
  const [inviteCode, setInviteCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePersonalLogin = async () => {
    try {
      setProfileType('personal');
      if (!user) {
        await loginWithGoogle();
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao entrar com Google');
    }
  };

  const handleInstitutionalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setIsValidating(true);
    setError(null);
    
    try {
      const isValid = await validateInviteCode(inviteCode);
      if (isValid) {
        if (user) {
          await linkUserToInstitution(user.uid, inviteCode);
          setProfileType('institutional');
        } else {
          localStorage.setItem('pending_invite_code', inviteCode);
          setProfileType('institutional');
          await loginWithGoogle();
        }
      } else {
        setError('Código de convite inválido ou expirado.');
        toast.error('Código inválido');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro na validação');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8 space-y-2">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground font-bold text-3xl mx-auto shadow-lg shadow-primary/20 mb-4"
          >
            O
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight">Bem-vindo ao OHEL</h1>
          <p className="text-muted-foreground">Escolha como deseja acessar sua plataforma</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'choice' ? (
            <motion.div
              key="choice"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              className="space-y-4"
            >
              <button
                onClick={handlePersonalLogin}
                className="w-full p-6 bg-card border rounded-2xl shadow-sm hover:shadow-md hover:border-primary/50 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">Uso Pessoal</h3>
                    <p className="text-sm text-muted-foreground">Gerencie suas tarefas e metas individuais.</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </button>

              <button
                onClick={() => setStep('institutional')}
                className="w-full p-6 bg-card border rounded-2xl shadow-sm hover:shadow-md hover:border-primary/50 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">Membro de Instituição</h3>
                    <p className="text-sm text-muted-foreground">Acesse o ambiente colaborativo da sua equipe.</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="institutional"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="bg-card border rounded-2xl p-8 shadow-xl space-y-6"
            >
              <div className="space-y-2">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Acesso Institucional
                </h3>
                <p className="text-sm text-muted-foreground">Digite o código de convite fornecido pelo seu administrador.</p>
              </div>

              <form onSubmit={handleInstitutionalSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteCode">Código de Convite</Label>
                  <Input 
                    id="inviteCode"
                    placeholder="Ex: OHEL-XXXX-XXXX"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="h-12 text-lg tracking-widest font-mono"
                    disabled={isValidating}
                  />
                  {error && (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {error}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-lg gap-2"
                    disabled={isValidating || !inviteCode.trim()}
                  >
                    {isValidating ? (
                      <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        Validar e Entrar
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setStep('choice')}
                    disabled={isValidating}
                  >
                    Voltar para opções
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center mt-8 text-xs text-muted-foreground uppercase tracking-widest font-medium">
          Powered by Firebase Authentication
        </p>
      </div>
    </div>
  );
};
