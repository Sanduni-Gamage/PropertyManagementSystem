import { useNavigate } from "react-router-dom";



export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="p-8 text-center">
            <h1 className="text-3xl font-bold">🏠 Welcome to RentalWise</h1>
            <p className="mt-4">Your smart property management platform.</p>

            <button
                onClick={() => navigate('/register')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg shadow"
            >
                Register
            </button>
        </div>

    );
}
