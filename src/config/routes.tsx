import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// lazy loading dos componentes para melhor performance
import Login from '../pages/auth/Login';
import ForgotPassword from '../pages/auth/ForgotPassword';
import Dashboard from '../pages/dashboard/Dashboard';
import Students from '../pages/students/Students';
import RegisterStudent from '../pages/students/RegisterStudent';
import EditStudent from '../pages/students/EditStudent';
import StudentDashboard from '../pages/students/StudentDashboard';
import Staff from '../pages/staff/Staff';
import RegisterStaff from '../pages/staff/RegisterStaff';
import EditStaff from '../pages/staff/EditStaff';
import Books from '../pages/books/Books';
import RegisterBook from '../pages/books/RegisterBook';
import EditBook from '../pages/books/EditBook';
import Classes from '../pages/classes/Classes';
import EditClass from '../pages/classes/EditClass';
import StudentLoans from '../pages/loans/StudentLoans';
import StudentLoanDetail from '../pages/loans/StudentLoanDetail';
import StaffLoans from '../pages/loans/StaffLoans';
import StudentReturns from '../pages/returns/StudentReturns';
import StudentWithdrawals from '../pages/withdrawals/StudentWithdrawals';
import StaffWithdrawals from '../pages/withdrawals/StaffWithdrawals';
import BookSelection from '../pages/withdrawals/BookSelection';
import CodeSelection from '../pages/withdrawals/CodeSelection';
import WithdrawalConfirmation from '../pages/withdrawals/WithdrawalConfirmation';
import StaffWithdrawalConfirmation from '../pages/withdrawals/StaffWithdrawalConfirmation';
import SelectStaffBook from '../pages/withdrawals/SelectStaffBook';
import Settings from '../pages/settings/Settings';
import UpdateNotification from '../pages/admin/UpdateNotification';
import Home from '../pages/Home';
import { ROUTES } from '../constants';

// redireciona com base no estado de autenticação
export const RedirectBasedOnAuth = () => {
  const { currentUser } = useAuth();
  return currentUser ? <Navigate to={ROUTES.DASHBOARD} /> : <Navigate to={ROUTES.LOGIN} />;
};

// rotas públicas
export const publicRoutes = [
  {
    path: ROUTES.HOME,
    element: <Home />,
  },
  {
    path: "/home",
    element: <Home />,
  },
  {
    path: ROUTES.LOGIN,
    element: <Login />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
];

// rotas protegidas
export const protectedRoutes = [
  {
    path: ROUTES.DASHBOARD,
    element: <Dashboard />,
  },
  {
    path: ROUTES.STUDENTS,
    element: <Students />,
  },
  {
    path: "/students/register",
    element: <RegisterStudent />,
  },
  {
    path: "/students/:studentId/edit",
    element: <EditStudent />,
  },
  {
    path: "/students/:studentId",
    element: <StudentDashboard />,
  },
  {
    path: ROUTES.STAFF,
    element: <Staff />,
  },
  {
    path: "/staff/register",
    element: <RegisterStaff />,
  },
  {
    path: "/staff/:id",
    element: <EditStaff />,
  },
  {
    path: "/staff/:id/edit",
    element: <EditStaff />,
  },
  {
    path: ROUTES.BOOKS,
    element: <Books />,
  },
  {
    path: "/books/register",
    element: <RegisterBook />,
  },
  {
    path: "/books/:bookId",
    element: <EditBook />,
  },
  {
    path: ROUTES.CLASSES,
    element: <Classes />,
  },
  {
    path: "/classes/:className/:shift",
    element: <EditClass />,
  },
  {
    path: "/student-loans",
    element: <StudentLoans key="student-loans" />,
  },
  {
    path: "/student-loan-detail/:loanId",
    element: <StudentLoanDetail />,
  },
  {
    path: "/staff-loans",
    element: <StaffLoans />,
  },
  {
    path: "/student-returns",
    element: <StudentReturns />,
  },
  {
    path: "/student-withdrawals",
    element: <StudentWithdrawals />,
  },
  {
    path: "/student-withdrawals/:studentId",
    element: <BookSelection />,
  },
  {
    path: "/code-selection/:studentId/:bookId",
    element: <CodeSelection />,
  },
  {
    path: "/withdrawal-confirmation/:studentId/:bookId",
    element: <WithdrawalConfirmation />,
  },
  {
    path: "/staff-withdrawals",
    element: <StaffWithdrawals />,
  },
  {
    path: "/staff-withdrawals/:staffId",
    element: <SelectStaffBook />,
  },
  {
    path: "/staff-withdrawals/:staffId/confirm/:bookId",
    element: <StaffWithdrawalConfirmation />,
  },
  {
    path: ROUTES.SETTINGS,
    element: <Settings />,
  },
  {
    path: "/admin/update-notification",
    element: <UpdateNotification />,
  },
]; 