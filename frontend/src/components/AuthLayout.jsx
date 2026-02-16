import PropTypes from "prop-types";

const AuthLayout = ({ title, subtitle, children }) => {
    return (
        <div className="min-h-screen bg-linear-to-br from-slate-850 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Header Section with Logo */}
                <div className="text-center mb-8">
                    <img
                        alt="Note App Logo"
                        className="h-16 mx-auto mb-6"
                        src="/images/logo.png"
                    />
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {title}
                    </h1>
                    <p className="text-slate-300 text-sm">{subtitle}</p>
                </div>

                {/* White Card Container */}
                <div className="bg-white rounded-lg shadow-xl p-8">
                    {children}
                </div>

                {/* Footer Security Text */}
                <div className="mt-8 text-center">
                    <p className="text-slate-400 text-xs">
                        Secure authentication powered by enterprise-grade
                        security
                    </p>
                </div>
            </div>
        </div>
    );
};

AuthLayout.propTypes = {
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    children: PropTypes.node.isRequired,
};

export default AuthLayout;
