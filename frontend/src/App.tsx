import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import ReturnFlow from './pages/ReturnFlow';
import OwnerList from './pages/OwnerList';

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 font-medium transition ${
    isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
  }`;

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex flex-col gap-3 max-w-2xl justify-between px-4 py-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-base font-semibold">Teehaus Lindner</h1>
            <p className="text-xs text-slate-500">Online returns</p>
          </div>
          <nav className="flex gap-1 rounded-lg bg-slate-100 p-1 text-sm w-fit">
            <NavLink to="/return-flow" className={tabClass}>
              Register a return
            </NavLink>
            <NavLink to="/owner-list" className={tabClass}>
              Owner
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-2xl p-4 md:py-8">
        <div className="rounded-2xl bg-white p-4 md:p-6 shadow-sm ring-1 ring-slate-100">
          <Routes>
            <Route path="/return-flow" element={<ReturnFlow />} />
            <Route path="/owner-list" element={<OwnerList />} />
            <Route path="/" element={<Navigate to="/return-flow" replace />} />
            <Route path="*" element={<Navigate to="/return-flow" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
