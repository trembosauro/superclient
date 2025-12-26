import { useState } from 'react';
import { Box, Stack, Typography, Button } from '@mui/material';
import { SearchField } from '../ui/SearchField';

/**
 * Diagnostic page for SearchField VE
 * Identifies the exact element causing white box appearance
 */
export function SearchFieldDiagnostic() {
  const [value, setValue] = useState('');

  const runCompleteDiagnostic = () => {
    console.clear();
    console.log('=== SearchField Complete Diagnostic ===\n');

    // Find all TextField wrappers (SearchField uses TextField internally)
    const wrappers = document.querySelectorAll('[data-ve="textfield-wrapper"]');
    console.log(`Found ${wrappers.length} TextField wrapper(s)\n`);

    wrappers.forEach((wrapper, wrapperIndex) => {
      console.log(`\n--- Wrapper ${wrapperIndex} ---`);

      // Step 1: Count inputs
      const inputs = wrapper.querySelectorAll('input');
      console.log(`✓ Input count: ${inputs.length}`);
      
      if (inputs.length === 0) {
        console.error('❌ FAIL: No input found!');
        return;
      }
      
      if (inputs.length > 1) {
        console.error(`❌ FAIL: Multiple inputs found (${inputs.length}). Should be exactly 1.`);
      } else {
        console.log('✅ PASS: Exactly 1 input');
      }

      // Step 2: Check each input
      inputs.forEach((input, inputIndex) => {
        console.log(`\nInput ${inputIndex}:`);
        console.log('  type:', input.getAttribute('type'));
        console.log('  data-ve:', input.getAttribute('data-ve'));
        console.log('  className:', input.className);

        const hasVEAttribute = input.getAttribute('data-ve') === 'textfield-input';
        console.log(hasVEAttribute ? '  ✅ Has data-ve="textfield-input"' : '  ❌ Missing data-ve="textfield-input"');

        const hasClassName = input.className && input.className.length > 0;
        console.log(hasClassName ? '  ✅ Has className' : '  ❌ Missing className');

        // Computed styles
        const computed = window.getComputedStyle(input);
        const rect = input.getBoundingClientRect();

        const styles = {
          backgroundColor: computed.backgroundColor,
          borderTopWidth: computed.borderTopWidth,
          borderRightWidth: computed.borderRightWidth,
          borderBottomWidth: computed.borderBottomWidth,
          borderLeftWidth: computed.borderLeftWidth,
          outline: computed.outline,
          boxShadow: computed.boxShadow,
          width: computed.width,
          height: computed.height,
          flex: computed.flex,
          appearance: computed.appearance,
          rect: {
            width: rect.width.toFixed(2),
            height: rect.height.toFixed(2),
          },
        };

        console.log('  Computed styles:', styles);

        // Validate
        const isBackgroundTransparent = 
          computed.backgroundColor === 'rgba(0, 0, 0, 0)' || 
          computed.backgroundColor === 'transparent' ||
          computed.backgroundColor === 'rgba(0,0,0,0)';
        
        const isBorderZero = 
          computed.borderTopWidth === '0px' && 
          computed.borderBottomWidth === '0px' &&
          computed.borderLeftWidth === '0px' &&
          computed.borderRightWidth === '0px';

        console.log(isBackgroundTransparent ? '  ✅ Background is transparent' : `  ❌ Background is NOT transparent: ${computed.backgroundColor}`);
        console.log(isBorderZero ? '  ✅ Border is zero' : '  ❌ Border is NOT zero');
      });

      // Step 3: Find elements with non-transparent background
      console.log('\n--- Searching for elements with non-transparent background ---');
      
      const allElements = wrapper.querySelectorAll('*');
      const elementsWithBackground: Array<{
        tag: string;
        className: string;
        dataVe: string | null;
        backgroundColor: string;
        area: number;
      }> = [];

      allElements.forEach((el) => {
        const computed = window.getComputedStyle(el);
        const bg = computed.backgroundColor;
        
        // Check if not transparent
        if (bg && 
            bg !== 'rgba(0, 0, 0, 0)' && 
            bg !== 'transparent' &&
            bg !== 'rgba(0,0,0,0)' &&
            bg !== 'inherit') {
          
          const rect = el.getBoundingClientRect();
          const area = rect.width * rect.height;
          
          if (area > 100) { // Ignore tiny elements
            elementsWithBackground.push({
              tag: el.tagName.toLowerCase(),
              className: (el as HTMLElement).className || '',
              dataVe: el.getAttribute('data-ve'),
              backgroundColor: bg,
              area: Math.round(area),
            });
          }
        }
      });

      if (elementsWithBackground.length === 0) {
        console.log('✅ PASS: No elements with non-transparent background found');
      } else {
        console.log(`❌ FAIL: Found ${elementsWithBackground.length} element(s) with non-transparent background:`);
        elementsWithBackground
          .sort((a, b) => b.area - a.area)
          .forEach((el, i) => {
            console.log(`  ${i + 1}. <${el.tag}> area=${el.area}px² bg="${el.backgroundColor}"`);
            console.log(`     className: "${el.className}"`);
            console.log(`     data-ve: "${el.dataVe || 'none'}"`);
          });
      }

      // Step 4: Check clear button and ghost
      const clearBtn = wrapper.querySelector('[data-ve="searchfield-clear"]');
      const ghostSpan = wrapper.querySelector('[data-ve="searchfield-ghost"]');
      
      if (clearBtn) {
        const computed = window.getComputedStyle(clearBtn);
        console.log('\n--- Clear Button ---');
        console.log('  background:', computed.backgroundColor);
        console.log('  border:', computed.borderTopWidth);
      }
      
      if (ghostSpan) {
        const computed = window.getComputedStyle(ghostSpan);
        console.log('\n--- Ghost Span ---');
        console.log('  background:', computed.backgroundColor);
        console.log('  border:', computed.borderTopWidth);
      }
    });

    console.log('\n=== Diagnostic Complete ===');
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        SearchField Diagnostic
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
        <Button variant="contained" onClick={runCompleteDiagnostic} color="primary">
          🔍 Run Complete Diagnostic
        </Button>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Open browser console and click the button above to see detailed analysis.
      </Typography>

      <Typography variant="h6" gutterBottom>
        Empty SearchField
      </Typography>
      <Box sx={{ maxWidth: 400, mb: 4 }}>
        <SearchField
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type to search..."
          onClear={() => setValue('')}
        />
      </Box>

      <Typography variant="h6" gutterBottom>
        SearchField with value
      </Typography>
      <Box sx={{ maxWidth: 400, mb: 4 }}>
        <SearchField
          value="Sample text"
          onChange={() => {}}
          placeholder="Search..."
          onClear={() => {}}
        />
      </Box>

      <Box sx={{ mt: 6, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Expected Results:
        </Typography>
        <ul style={{ marginTop: 8 }}>
          <li><strong>Input count:</strong> Exactly 1</li>
          <li><strong>data-ve attribute:</strong> input has data-ve="textfield-input"</li>
          <li><strong>className:</strong> input has VE className (not empty)</li>
          <li><strong>Background:</strong> transparent or rgba(0,0,0,0)</li>
          <li><strong>Border:</strong> all sides 0px</li>
          <li><strong>White box elements:</strong> None found</li>
        </ul>
      </Box>
    </Box>
  );
}
