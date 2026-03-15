import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { token } = useAuth();

  return (
    <div className="min-h-screen bg-pastel-gray flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <h1 className="text-4xl font-bold text-gray-800">One Face</h1>
        <p className="text-lg text-gray-600">
          Анонимная платформа для общения между учениками одной школы. 
          Без публичных профилей — только приватные чаты с автоматическим подбором собеседников.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {token ? (
            <Link
              to="/chat"
              className="px-6 py-3 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-800 transition"
            >
              Перейти в чат
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-6 py-3 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-800 transition"
              >
                Вход
              </Link>
              <Link
                to="/register"
                className="px-6 py-3 bg-pastel-green text-gray-800 rounded-xl font-medium hover:bg-pastel-green/80 transition border border-gray-300"
              >
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
