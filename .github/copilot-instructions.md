# GitHub Copilot Instructions — Ant Design

This project is a **React 19 + TypeScript + Vite** frontend using **Ant Design v6** (`antd ^6.3.7`).

## Ant Design Reference

- **Index (llms.txt):** https://ant.design/llms.txt
- **Full docs (llms-full.txt):** https://ant.design/llms-full.txt
- **Semantic docs:** https://ant.design/llms-semantic.md

> Always consult the sources above for up-to-date props, types, and usage examples.

---

## Project Stack

| Technology | Version |
|---|---|
| React | 19 |
| TypeScript | ~6 |
| Vite | 8 |
| Ant Design (`antd`) | ^6 |

---

## Ant Design Usage Guidelines

### 1. Imports

Always import components directly from `antd`:

```tsx
import { Button, Form, Input, Table } from 'antd';
import type { TableColumnsType, FormProps } from 'antd';
```

Import icons from `@ant-design/icons` (install separately if needed):

```tsx
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
```

### 2. App Wrapper

Wrap the root with `<App>` to enable static methods (`message`, `notification`, `modal`) via hooks:

```tsx
import { App } from 'antd';

const Root = () => (
  <App>
    <YourApp />
  </App>
);
```

Use `App.useApp()` inside components instead of static imports:

```tsx
const { message, notification, modal } = App.useApp();
```

### 3. Theme Customisation

Use `ConfigProvider` with a `theme` token at the root:

```tsx
import { ConfigProvider } from 'antd';

<ConfigProvider theme={{ token: { colorPrimary: '#1677ff' } }}>
  <App />
</ConfigProvider>
```

For dark mode use the built-in algorithm:

```tsx
import { theme } from 'antd';

<ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
```

### 4. Forms

Prefer controlled forms via `Form` + `Form.Item` with `name` props:

```tsx
const [form] = Form.useForm();

<Form form={form} onFinish={onFinish} layout="vertical">
  <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
    <Input />
  </Form.Item>
</Form>
```

### 5. Tables

Type columns explicitly:

```tsx
const columns: TableColumnsType<MyRecord> = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
];

<Table columns={columns} dataSource={data} rowKey="id" />
```

### 6. Layout

Use `Layout`, `Row`/`Col`, `Flex`, and `Space` for composition:

```tsx
import { Layout, Flex, Space } from 'antd';
const { Header, Sider, Content, Footer } = Layout;
```

### 7. Icons

`@ant-design/icons` must be installed separately. Use outlined variants by default:

```tsx
import { HomeOutlined } from '@ant-design/icons';
<HomeOutlined style={{ fontSize: 20 }} />
```

---

## Available Components (Ant Design v6)

**General:** `Button`, `FloatButton`, `Icon`, `Typography`  
**Layout:** `Divider`, `Flex`, `Grid (Row/Col)`, `Layout`, `Space`, `Splitter`  
**Navigation:** `Anchor`, `Breadcrumb`, `Dropdown`, `Menu`, `Pagination`, `Steps`, `Tabs`  
**Data Entry:** `AutoComplete`, `Cascader`, `Checkbox`, `ColorPicker`, `DatePicker`, `Form`, `Input`, `InputNumber`, `Mentions`, `Radio`, `Rate`, `Select`, `Slider`, `Switch`, `TimePicker`, `Transfer`, `TreeSelect`, `Upload`  
**Data Display:** `Avatar`, `Badge`, `Calendar`, `Card`, `Carousel`, `Collapse`, `Descriptions`, `Empty`, `Image`, `List`, `Masonry`, `Popover`, `QRCode`, `Segmented`, `Statistic`, `Table`, `Tag`, `Timeline`, `Tooltip`, `Tour`, `Tree`  
**Feedback:** `Alert`, `Drawer`, `Message`, `Modal`, `Notification`, `Popconfirm`, `Progress`, `Result`, `Skeleton`, `Spin`  
**Other:** `Affix`, `App`, `ConfigProvider`, `Watermark`

---

## Migration Notes (v5 → v6)

- Guide: https://ant.design/docs/react/migration-v6.md
- CSS variables are now the default styling strategy.
- `App` component is required for hook-based static methods.
- Some props have been renamed or removed — always check the migration guide.
