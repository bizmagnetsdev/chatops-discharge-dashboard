export default function Loading() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50/50 dark:bg-gray-900/50">
            <div className="flex flex-col items-center gap-4">
                <svg className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <div className="flex flex-col items-center">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                        Loading...
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Please wait while we loading the records.
                    </p>
                </div>
            </div>
        </div>
    );
}
