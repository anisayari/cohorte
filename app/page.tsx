'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <main className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            Cohorte
          </h1>
          <p className="text-xl text-gray-600">
            Analyze your scripts with AI‑generated personas
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">How it works</h2>
          <ol className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</span>
              <div>
                <h3 className="font-semibold text-gray-800">Generate personas</h3>
                <p className="text-gray-600">Create diverse reader profiles to assess your content</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</span>
              <div>
                <h3 className="font-semibold text-gray-800">Write your script</h3>
                <p className="text-gray-600">Use our rich editor with advanced formatting</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</span>
              <div>
                <h3 className="font-semibold text-gray-800">Analyze with AI</h3>
                <p className="text-gray-600">Get detailed feedback from each persona on your text</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">4</span>
              <div>
                <h3 className="font-semibold text-gray-800">Comment and collaborate</h3>
                <p className="text-gray-600">Add comments and discuss improvements</p>
              </div>
            </li>
          </ol>
        </div>

        <div className="flex gap-4 items-center justify-center">
          <Link
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 inline-block"
            href="/editor"
          >
            Start writing
          </Link>
          <a
            className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-xl shadow-lg border border-gray-200 transition-all duration-200 inline-block"
            href="https://github.com/anisayari/cohorte"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </a>
        </div>
      </main>
      <footer className="mt-12 text-center text-gray-600 absolute bottom-8">
        <p>Made with ❤️ by Anis Ayari</p>
      </footer>
    </div>
  );
}
