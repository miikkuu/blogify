import Header from "./Header";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-col flex-grow">
        <main className="flex-grow container mx-auto px-4 py-8">
          <Outlet />
        </main>
        <footer className="bg-gray-100 py-4 text-center text-gray-600">
          © 2024 Created With Love by{" "}
          <a
            href="https://github.com/miikkuu"
            className="text-pink-600 hover:text-purple-800"
          >
            @miikkuu
          </a>
        </footer>
      </div>
    </div>
  );
}