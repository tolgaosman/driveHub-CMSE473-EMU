'use client';

import React from 'react';
import { Globe } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { LANGUAGES, Lang, t } from '@/lib/i18n';
import { Select } from './Select';

export const LanguageMenu: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { lang, setLang } = useApp();
  return (
    <Select<Lang>
      value={lang}
      onChange={setLang}
      ariaLabel={t(lang, 'language')}
      size="sm"
      align="end"
      icon={<Globe className="h-3.5 w-3.5" />}
      className={`w-[118px] ${className}`}
      menuClassName="w-40"
      options={LANGUAGES.map((l) => ({ value: l.value, label: l.label, text: l.label, hint: l.code }))}
    />
  );
};
