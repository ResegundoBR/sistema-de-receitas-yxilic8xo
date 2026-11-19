/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import RecipeDetail from './pages/RecipeDetail'
import RecipeForm from './pages/RecipeForm'
import MyKitchen from './pages/MyKitchen'
import Collections from './pages/Collections'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Salvos from './pages/Salvos'
import Admin from './pages/Admin'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'

const App = () => (
  <BrowserRouter>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Index />} />
          {/* Explorar: busca e navegação pelo acervo público */}
          <Route path="/explorar" element={<Index />} />
          {/* Public recipe share route /r/:username/:slug */}
          <Route path="/r/:username/:slug" element={<RecipeDetail />} />

          {/* Recipe creation & edition */}
          <Route path="/receitas/nova" element={<RecipeForm />} />
          <Route path="/receitas/editar/:id" element={<RecipeForm />} />

          {/* User kitchen & collections */}
          <Route path="/minha-cozinha" element={<MyKitchen />} />
          <Route path="/colecoes" element={<Collections />} />
          <Route path="/salvos" element={<Salvos />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
