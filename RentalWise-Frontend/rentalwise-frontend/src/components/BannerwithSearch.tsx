import { IoSearch } from "react-icons/io5";
import SearchBar from '../components/SearchBar';

export default function BannerwithSearch() {
  
  return (
    <div
      className="w-full bg-cover bg-center bg-no-repeat text-white px-4 md:px-8 py-10 md:py-20 flex flex-col items-center text-center min-h-[500px]"
      style={{ backgroundImage: `url('/images/hero.jpg')` }}
    >
      <h2 className="text-4xl md:text-6xl font-extrabold mt-20 max-w-3xl">
        Let your property <br />
        adventure begin!
      </h2>

      <SearchBar />
    </div>
  );
}
