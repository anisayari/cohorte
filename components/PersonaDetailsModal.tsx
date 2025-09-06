'use client';

import React from 'react';
import { X, User, MapPin, Briefcase, Calendar, Heart, Brain, Quote } from 'lucide-react';

interface Persona {
  first_name: string;
  last_name: string;
  mini_description?: string;
  age?: number;
  gender?: string;
  city: string;
  country?: string;
  profession: string;
  income_level?: string;
  education_level?: string;
  marital_status?: string;
  children?: number;
  values?: string[];
  lifestyle?: string;
  bio?: string;
}

interface PersonaDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  persona: Persona | null;
}

export default function PersonaDetailsModal({ isOpen, onClose, persona }: PersonaDetailsModalProps) {
  if (!isOpen || !persona) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-white/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {persona.first_name} {persona.last_name}
            </h2>
            <p className="text-gray-500 mt-1">{persona.mini_description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">Age & Gender</p>
              <p className="text-gray-900">{persona.age} y • {persona.gender}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">Location</p>
              <p className="text-gray-900">{persona.city}, {persona.country}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">Profession</p>
              <p className="text-gray-900">{persona.profession}</p>
              <p className="text-gray-600 text-sm mt-1">Income: {persona.income_level}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">Education</p>
              <p className="text-gray-900">{persona.education_level}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Heart className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">Family status</p>
              <p className="text-gray-900">
                {persona.marital_status}
                {persona.children > 0 && ` • ${persona.children} child${persona.children > 1 ? 'ren' : ''}`}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">Values</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {persona.values?.map((value: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
                    {value}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {persona.lifestyle && (
            <div className="flex items-start gap-3">
              <Quote className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Lifestyle</p>
                <p className="text-gray-900 italic">&quot;{persona.lifestyle}&quot;</p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Full summary</p>
            <p className="text-gray-600 text-sm leading-relaxed">{persona.bio}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
