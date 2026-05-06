import {Routes,Route} from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ExamPage from './pages/ExamPage';
export default function App(){return <Routes><Route path='/' element={<Login/>}/><Route path='/dashboard' element={<Dashboard/>}/><Route path='/admin' element={<AdminDashboard/>}/><Route path='/exam' element={<ExamPage/>}/></Routes>}