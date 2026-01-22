import { ArrayNode, Preset } from './types';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export const DEFAULT_NODE: ArrayNode = {
  id: 'root',
  key: 'root',
  type: 'array',
  value: null,
  isAssociative: true,
  children: [
    { id: '1', key: 'level', type: 'number', value: 8, children: [], isAssociative: false },
    { id: '2', key: 'paths', type: 'array', value: null, isAssociative: false, listType: 'list', children: [
        { id: '3', key: '0', type: 'string', value: 'src', children: [], isAssociative: false },
        { id: '4', key: '1', type: 'string', value: 'tests', children: [], isAssociative: false },
    ] },
    { id: '5', key: 'parameters', type: 'array', value: null, isAssociative: true, children: [
        { id: '6', key: 'checkMissingIterableValueType', type: 'boolean', value: false, children: [], isAssociative: false },
        { id: '7', key: 'inferPrivatePropertyTypeFromConstructor', type: 'boolean', value: true, children: [], isAssociative: false },
    ] },
  ],
};

// 1. PHPStan Config (The requested inspiration)
const PRESET_PHPSTAN: ArrayNode = {
  id: generateId(),
  key: 'root',
  type: 'array',
  value: null,
  isAssociative: true,
  children: [
    { id: generateId(), key: 'parameters', type: 'array', value: null, isAssociative: true, children: [
        { id: generateId(), key: 'level', type: 'number', value: 9, children: [], isAssociative: false },
        { id: generateId(), key: 'phpVersion', type: 'number', value: 80200, children: [], isAssociative: false },
        { id: generateId(), key: 'paths', type: 'array', value: null, isAssociative: false, listType: 'list', children: [
            { id: generateId(), key: '0', type: 'string', value: 'src', children: [], isAssociative: false },
            { id: generateId(), key: '1', type: 'string', value: 'tests', children: [], isAssociative: false },
        ] },
        { id: generateId(), key: 'excludePaths', type: 'array', value: null, isAssociative: true, children: [
             { id: generateId(), key: 'analyse', type: 'array', value: null, isAssociative: false, listType: 'list', children: [
                 { id: generateId(), key: '0', type: 'string', value: 'src/Legacy/*', children: [], isAssociative: false },
             ]},
        ] },
        { id: generateId(), key: 'ignoreErrors', type: 'array', value: null, isAssociative: false, listType: 'list', children: [
             { id: generateId(), key: '0', type: 'array', value: null, isAssociative: true, children: [
                 { id: generateId(), key: 'message', type: 'string', value: '#^Call to an undefined method#', children: [], isAssociative: false },
                 { id: generateId(), key: 'path', type: 'string', value: 'src/Magic.php', children: [], isAssociative: false },
                 { id: generateId(), key: 'count', type: 'number', value: 1, children: [], isAssociative: false },
             ]},
        ] },
        { id: generateId(), key: 'treatPhpDocTypesAsCertain', type: 'boolean', value: false, children: [], isAssociative: false },
    ]},
  ],
};

// 2. Composer.json Structure
const PRESET_COMPOSER: ArrayNode = {
  id: generateId(),
  key: 'root',
  type: 'array',
  value: null,
  isAssociative: true,
  children: [
    { id: generateId(), key: 'name', type: 'string', value: 'acme/framework', children: [], isAssociative: false },
    { id: generateId(), key: 'type', type: 'string', value: 'library', children: [], isAssociative: false },
    { id: generateId(), key: 'license', type: 'string', value: 'MIT', children: [], isAssociative: false },
    { id: generateId(), key: 'require', type: 'array', value: null, isAssociative: true, children: [
        { id: generateId(), key: 'php', type: 'string', value: '^8.2', children: [], isAssociative: false },
        { id: generateId(), key: 'ext-json', type: 'string', value: '*', children: [], isAssociative: false },
        { id: generateId(), key: 'guzzlehttp/guzzle', type: 'string', value: '^7.0', children: [], isAssociative: false },
    ] },
    { id: generateId(), key: 'autoload', type: 'array', value: null, isAssociative: true, children: [
        { id: generateId(), key: 'psr-4', type: 'array', value: null, isAssociative: true, children: [
            { id: generateId(), key: 'Acme\\', type: 'string', value: 'src/', children: [], isAssociative: false },
        ] },
    ] },
    { id: generateId(), key: 'authors', type: 'array', value: null, isAssociative: false, listType: 'list', children: [
        { id: generateId(), key: '0', type: 'array', value: null, isAssociative: true, children: [
            { id: generateId(), key: 'name', type: 'string', value: 'John Doe', children: [], isAssociative: false },
            { id: generateId(), key: 'email', type: 'string', value: 'john@example.com', children: [], isAssociative: false },
        ] },
    ] },
  ],
};

// 3. Symfony Service Config (YAML-style array)
const PRESET_SYMFONY: ArrayNode = {
  id: generateId(),
  key: 'root',
  type: 'array',
  value: null,
  isAssociative: true,
  children: [
    { id: generateId(), key: 'services', type: 'array', value: null, isAssociative: true, children: [
        { id: generateId(), key: '_defaults', type: 'array', value: null, isAssociative: true, children: [
            { id: generateId(), key: 'autowire', type: 'boolean', value: true, children: [], isAssociative: false },
            { id: generateId(), key: 'configure', type: 'boolean', value: true, children: [], isAssociative: false },
        ] },
        { id: generateId(), key: 'App\\', type: 'array', value: null, isAssociative: true, children: [
            { id: generateId(), key: 'resource', type: 'string', value: '../src/', children: [], isAssociative: false },
            { id: generateId(), key: 'exclude', type: 'string', value: '../src/{DependencyInjection,Entity,Kernel.php}', children: [], isAssociative: false },
        ] },
        { id: generateId(), key: 'App\\Service\\PaymentService', type: 'array', value: null, isAssociative: true, children: [
            { id: generateId(), key: 'arguments', type: 'array', value: null, isAssociative: true, children: [
                { id: generateId(), key: '$apiKey', type: 'string', value: '%env(STRIPE_KEY)%', children: [], isAssociative: false },
            ] },
        ] },
    ] },
  ],
};

// 4. E-Commerce Order (Deep Data Structure)
const PRESET_ORDER: ArrayNode = {
  id: generateId(),
  key: 'root',
  type: 'array',
  value: null,
  isAssociative: true,
  children: [
    { id: generateId(), key: 'id', type: 'string', value: 'ord_59283', children: [], isAssociative: false },
    { id: generateId(), key: 'status', type: 'string', value: 'processing', children: [], isAssociative: false },
    { id: generateId(), key: 'totals', type: 'array', value: null, isAssociative: true, children: [
         { id: generateId(), key: 'subtotal', type: 'number', value: 29900, children: [], isAssociative: false },
         { id: generateId(), key: 'tax', type: 'number', value: 5980, children: [], isAssociative: false },
         { id: generateId(), key: 'grand_total', type: 'number', value: 35880, children: [], isAssociative: false },
         { id: generateId(), key: 'currency', type: 'string', value: 'USD', children: [], isAssociative: false },
    ] },
    { id: generateId(), key: 'items', type: 'array', value: null, isAssociative: false, listType: 'list', children: [
         { id: generateId(), key: '0', type: 'array', value: null, isAssociative: true, children: [
             { id: generateId(), key: 'sku', type: 'string', value: 'IPHONE-15-PRO', children: [], isAssociative: false },
             { id: generateId(), key: 'qty', type: 'number', value: 1, children: [], isAssociative: false },
             { id: generateId(), key: 'price', type: 'number', value: 99900, children: [], isAssociative: false },
             { id: generateId(), key: 'attributes', type: 'array', value: null, isAssociative: true, children: [
                 { id: generateId(), key: 'color', type: 'string', value: 'Titanium', children: [], isAssociative: false },
                 { id: generateId(), key: 'storage', type: 'string', value: '256GB', children: [], isAssociative: false },
             ] },
         ] },
         { id: generateId(), key: '1', type: 'array', value: null, isAssociative: true, children: [
             { id: generateId(), key: 'sku', type: 'string', value: 'CASE-SILICONE', children: [], isAssociative: false },
             { id: generateId(), key: 'qty', type: 'number', value: 1, children: [], isAssociative: false },
             { id: generateId(), key: 'price', type: 'number', value: 4900, children: [], isAssociative: false },
             { id: generateId(), key: 'attributes', type: 'array', value: null, isAssociative: true, children: [
                 { id: generateId(), key: 'color', type: 'string', value: 'Midnight', children: [], isAssociative: false },
             ] },
         ] },
    ] },
    { id: generateId(), key: 'customer', type: 'array', value: null, isAssociative: true, children: [
        { id: generateId(), key: 'id', type: 'number', value: 882, children: [], isAssociative: false },
        { id: generateId(), key: 'email', type: 'string', value: 'alex@example.com', children: [], isAssociative: false },
        { id: generateId(), key: 'is_vip', type: 'boolean', value: true, children: [], isAssociative: false },
    ] },
  ],
};

// 5. Simple List (Classic)
const PRESET_SIMPLE: ArrayNode = {
    id: generateId(),
    key: 'root',
    type: 'array',
    value: null,
    isAssociative: false,
    listType: 'list',
    children: [
      { id: generateId(), key: '0', type: 'string', value: 'Draft', children: [], isAssociative: false },
      { id: generateId(), key: '1', type: 'string', value: 'Review', children: [], isAssociative: false },
      { id: generateId(), key: '2', type: 'string', value: 'Published', children: [], isAssociative: false },
      { id: generateId(), key: '3', type: 'string', value: 'Archived', children: [], isAssociative: false },
    ],
};

export const PRESETS: Preset[] = [
  { name: 'PHPStan Config', description: 'Complex tooling configuration with nested lists and ignored errors.', data: PRESET_PHPSTAN },
  { name: 'Composer.json', description: 'Standard package definition with dependencies and autoloading.', data: PRESET_COMPOSER },
  { name: 'Symfony Services', description: 'Service container configuration example.', data: PRESET_SYMFONY },
  { name: 'E-Commerce Order', description: 'Deep domain entity with line items and totals.', data: PRESET_ORDER },
  { name: 'Simple List', description: 'A flat list of strings. Ideal for Enums.', data: PRESET_SIMPLE },
];