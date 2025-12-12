import React from 'react';

// Allowed URLs and data URIs
export function EdgeCasesFixture() {
  const name = 'John';
  return (
    <div>
      {/* Allowed URLs/data */}
      <a href="https://example.com" title="https://example.com">
        https://example.com
      </a>
      <img src="/assets/logo.png" alt="/assets/logo.png" />
      <link rel="icon" href="data:image/png;base64,..." />

      {/* Allowed template literals with variables */}
      <div>{`Welcome ${name}`}</div>

      {/* Allowed empty strings, numbers, symbols */}
      <span></span>
      <input placeholder="" />
      <div>123</div>
      <span>$</span>
      <span>→</span>
    </div>
  );
}
