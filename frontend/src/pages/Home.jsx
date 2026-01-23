import { useNavigate } from "react-router-dom";

const Home = () => {
    const navigate = useNavigate();

    // Get user info from Local Storage
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));

    const handleLogout = () => {
        // Clear user data
        localStorage.removeItem("userInfo");
        // Redirect to Login
        navigate("/login");
    };

    return (
        <div className="p-10 text-center">
            <h1 className="text-3xl font-bold mb-4">
                Welcome to 10P Shine Notes!
            </h1>

            {userInfo ? (
                <div className="bg-green-100 p-6 rounded-lg inline-block">
                    <p className="text-xl">
                        Hello,{" "}
                        <span className="font-bold">
                            {userInfo.username || userInfo.name}
                        </span>
                        !
                    </p>
                    <p className="text-gray-600 mb-4">
                        You are successfully logged in.
                    </p>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                        Logout
                    </button>
                </div>
            ) : (
                <p>Please log in to see your content.</p>
            )}
        </div>
    );
};

export default Home;
