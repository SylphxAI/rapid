#!/usr/bin/env node
import stringWidth from 'string-width';

const desktopWithVS16 = '🖥️';
const _desktopWithoutVS16 = '🖥';

// Check the base without VS16
const _base = desktopWithVS16.replace('\uFE0F', '');
