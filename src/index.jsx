import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { EditorView, basicSetup } from "codemirror";
import { hoverTooltip } from "@codemirror/view";
import { yaml } from "@codemirror/lang-yaml";
import { javascript } from "@codemirror/lang-javascript";
import YAML from "js-yaml";
import {
  Plus,
  Upload,
  Link,
  Download,
  Copy,
  ChevronUp,
  ChevronDown,
  Trash2,
  FileCode2,
  ExternalLink,
  Braces,
  Layers2,
  Check,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import "./style.css";

const sample = `# mihomo 配置示例\nmixed-port: 7890\nallow-lan: false\nmode: rule\nlog-level: info\nipv6: false\n\ndns:\n  enable: true\n  enhanced-mode: fake-ip\n  nameserver:\n    - https://doh.pub/dns-query\n    - https://dns.alidns.com/dns-query\n\nproxies: []\nproxy-groups:\n  - name: PROXY\n    type: select\n    proxies:\n      - DIRECT\n\nrules:\n  - GEOIP,CN,DIRECT\n  - MATCH,PROXY\n`;
const docs = {
  "mixed-port": ["HTTP(S) 和 SOCKS 共用的代理端口。", "inbound/port/"],
  "allow-lan": ["是否允许局域网设备连接代理端口。", "general/#允许局域网"],
  mode: ["运行模式：rule、global 或 direct。", "general/#运行模式"],
  "log-level": ["内核日志输出级别。", "general/#日志级别"],
  ipv6: ["是否允许内核接受 IPv6 流量。", "general/#ipv6"],
  dns: ["DNS 服务器与解析行为配置。", "dns/"],
  "enhanced-mode": ["DNS 增强模式，例如 fake-ip 或 redir-host。", "dns/"],
  nameserver: ["默认 DNS 上游服务器列表。", "dns/"],
  tun: ["虚拟网卡入站配置。", "inbound/tun/"],
  proxies: ["定义出站代理节点。", "proxies/"],
  "proxy-providers": ["从远程或本地来源加载代理集合。", "proxy-providers/"],
  "proxy-groups": ["定义手动选择、自动选择等策略组。", "proxy-groups/"],
  rules: ["按顺序匹配流量并选择出站策略。", "rules/"],
  "rule-providers": ["引用远程或本地规则集合。", "rule-providers/"],
  sniffer: ["从流量中嗅探域名，辅助路由匹配。", "sniff/"],
  "external-controller": ["外部控制 API 的监听地址。", "general/#外部控制-api"],
  secret: ["外部控制 API 的访问密钥。", "general/#外部控制-api"],
};
const nestedDocs = {
  "dns.enable": ["启用 mihomo 内置 DNS 服务器。", "dns/"],
  "dns.listen": ["DNS 服务器监听地址。", "dns/"],
  "dns.ipv6": ["是否解析 IPv6 地址。", "dns/"],
  "dns.enhanced-mode": ["DNS 增强模式，例如 fake-ip 或 redir-host。", "dns/"],
  "dns.fake-ip-range": ["Fake IP 地址池。", "dns/"],
  "dns.fake-ip-filter": ["不返回 Fake IP 的域名列表。", "dns/"],
  "dns.nameserver": ["默认 DNS 上游服务器。", "dns/"],
  "dns.default-nameserver": ["用于解析 DNS 服务器域名的基础 DNS。", "dns/"],
  "dns.proxy-server-nameserver": ["用于解析代理节点域名的 DNS。", "dns/"],
  "dns.direct-nameserver": ["用于直连域名解析的 DNS。", "dns/"],
  "dns.nameserver-policy": ["为指定域名配置 DNS 服务器。", "dns/"],
  "dns.fallback": ["备用 DNS 服务器。", "dns/"],
  "dns.fallback-filter": ["配置备用 DNS 的结果过滤条件。", "dns/"],
  "dns.use-hosts": ["解析时使用 hosts 配置。", "dns/"],
  "dns.use-system-hosts": ["解析时使用系统 hosts。", "dns/"],
  "dns.respect-rules": ["DNS 连接遵循路由规则。", "dns/"],
  "tun.enable": ["启用 TUN 入站。", "inbound/tun/"],
  "tun.stack": ["TUN 网络栈类型。", "inbound/tun/"],
  "tun.device": ["TUN 设备名称。", "inbound/tun/"],
  "tun.auto-route": ["自动设置路由。", "inbound/tun/"],
  "tun.auto-detect-interface": ["自动检测出站网卡。", "inbound/tun/"],
  "tun.dns-hijack": ["需要劫持到内置 DNS 的地址。", "inbound/tun/"],
  "tun.strict-route": ["启用严格路由。", "inbound/tun/"],
  "tun.mtu": ["TUN 设备的最大传输单元。", "inbound/tun/"],
  "profile.store-selected": ["保存策略组选择结果。", "general/#缓存"],
  "profile.store-fake-ip": ["保存 Fake IP 映射。", "general/#缓存"],
  "sniffer.enable": ["启用域名嗅探。", "sniff/"],
  "sniffer.sniff": ["配置嗅探协议及端口。", "sniff/"],
  "sniffer.force-domain": ["强制嗅探的域名。", "sniff/"],
  "sniffer.skip-domain": ["跳过嗅探的域名。", "sniff/"],
  "sniffer.override-destination": ["使用嗅探到的域名覆盖连接目标。", "sniff/"],
  "proxy-groups.name": [
    "代理组名称，供规则和其他代理组引用。",
    "proxy-groups/",
  ],
  "proxy-groups.type": [
    "代理组类型，例如 select、url-test 或 fallback。",
    "proxy-groups/",
  ],
  "proxy-groups.proxies": ["代理组包含的代理或策略组名称。", "proxy-groups/"],
  "proxy-groups.use": ["代理组引用的代理集合。", "proxy-groups/"],
  "proxy-groups.url": ["用于健康检查的 URL。", "proxy-groups/"],
  "proxy-groups.interval": ["健康检查间隔，单位为秒。", "proxy-groups/"],
  "proxy-groups.filter": ["按正则表达式筛选代理名称。", "proxy-groups/"],
  "proxies.name": ["代理节点名称。", "proxies/"],
  "proxies.type": ["代理协议类型。", "proxies/"],
  "proxies.server": ["代理服务器地址。", "proxies/"],
  "proxies.port": ["代理服务器端口。", "proxies/"],
  "proxies.udp": ["是否启用 UDP 转发。", "proxies/"],
  "proxies.tls": ["是否启用 TLS。", "proxies/"],
  "proxies.servername": ["TLS 的服务器名称。", "proxies/tls/"],
  "proxies.skip-cert-verify": ["是否跳过 TLS 证书验证。", "proxies/tls/"],
  "proxies.uuid": ["代理协议使用的 UUID。", "proxies/"],
  "proxies.password": ["代理认证密码。", "proxies/"],
  "rule-providers.type": ["规则集合来源类型。", "rule-providers/"],
  "rule-providers.behavior": ["规则集合的匹配行为。", "rule-providers/"],
  "rule-providers.format": ["规则集合文件格式。", "rule-providers/"],
  "rule-providers.url": ["远程规则集合的 URL。", "rule-providers/"],
  "rule-providers.path": ["规则集合的本地路径。", "rule-providers/"],
  "rule-providers.interval": ["远程规则集合更新间隔。", "rule-providers/"],
};
// These pages document each of these fields under a matching heading.
for (const [path, info] of Object.entries(nestedDocs)) {
  const [section, name] = path.split(".");
  if (["dns", "tun", "proxy-groups"].includes(section)) info[1] += "#" + name;
}
function lookupField(view, pos, name) {
  const line = view.state.doc.lineAt(pos);
  let indent = line.text.search(/\S/);
  const parents = [];
  for (let n = line.number - 1; n > 0; n--) {
    const text = view.state.doc.line(n).text;
    const m = text.match(/^(\s*)(?:-\s*)?([\w-]+)\s*:/);
    if (!m) continue;
    const level = m[1].length;
    if (level < indent) {
      parents.unshift(m[2]);
      indent = level;
    }
  }
  const path = [...parents, name];
  for (let i = 0; i < path.length - 1; i++) {
    const direct = nestedDocs[path.slice(i).join(".")];
    if (direct) return direct;
    const section = nestedDocs[path[i] + "." + name];
    if (section) return section;
  }
  return docs[name];
}
const dnsTemplate = `dns:
  enable: true
  listen: ':53'
  enhanced-mode: 'fake-ip'
  fake-ip-range: '198.18.0.1/16'
  fake-ip-range6: 'fdfe:dcba:9876::1/64'
  fake-ip-filter-mode: 'blacklist'
  prefer-h3: false
  respect-rules: false
  use-hosts: false
  use-system-hosts: false
  ipv6: true
  fake-ip-filter:
    - '*.lan'
    - '*.local'
    - '*.arpa'
    - 'time.*.com'
    - 'ntp.*.com'
    - 'time.*.com'
    - '+.market.xiaomi.com'
    - 'localhost.ptlogin2.qq.com'
    - '*.msftncsi.com'
    - 'www.msftconnecttest.com'
  default-nameserver:
    - 'system'
    - '223.6.6.6'
    - '8.8.8.8'
    - '2400:3200::1'
    - '2001:4860:4860::8888'
  nameserver:
    - '8.8.8.8'
    - 'https://doh.pub/dns-query'
    - 'https://dns.alidns.com/dns-query'
  nameserver-policy: {}
  direct-nameserver-follow-policy: false
  fallback-filter:
    geoip: true
    geoip-code: 'CN'
    ipcidr:
      - '240.0.0.0/4'
      - '0.0.0.0/32'
    domain:
      - '+.google.com'
      - '+.facebook.com'
      - '+.youtube.com'
  fallback: []
  proxy-server-nameserver: []
  direct-nameserver: []
hosts: {}
`;
const initial = [
  {
    id: 1,
    type: "override",
    enabled: true,
    content: "mixed-port: 7890\nallow-lan: true\n",
  },
  {
    id: 2,
    type: "script",
    enabled: true,
    content:
      '// 接收上一步的配置对象，返回修改后的配置\nfunction main(config) {\n  config["log-level"] = "warning";\n  return config;\n}',
  },
];
function fieldAt(view, pos) {
  const line = view.state.doc.lineAt(pos);
  const match = line.text.match(/^\s*(?:-\s*)?([\w-]+)\s*:/);
  if (!match) return null;
  const start = line.from + match[0].indexOf(match[1]);
  return pos >= start &&
    pos <= start + match[1].length &&
    lookupField(view, pos, match[1])
    ? {
        name: match[1],
        info: lookupField(view, pos, match[1]),
        from: start,
        to: start + match[1].length,
      }
    : null;
}
const fieldHover = hoverTooltip((view, pos) => {
  const found = fieldAt(view, pos);
  if (!found) return null;
  return {
    pos: found.from,
    end: found.to,
    above: true,
    create() {
      const dom = document.createElement("div");
      dom.className = "field-tooltip";
      const title = document.createElement("strong");
      title.textContent = found.name;
      const desc = document.createElement("p");
      desc.textContent = found.info[0];
      const hint = document.createElement("small");
      hint.textContent = "Ctrl / ⌘ + 点击查看文档";
      dom.append(title, desc, hint);
      return { dom };
    },
  };
});
const fieldClick = EditorView.domEventHandlers({
  mousedown(event, view) {
    if (!(event.ctrlKey || event.metaKey) || event.button !== 0) return false;
    const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
    const found = pos == null ? null : fieldAt(view, pos);
    if (!found) return false;
    event.preventDefault();
    window.open(
      "https://wiki.metacubex.one/config/" + found.info[1],
      "_blank",
      "noopener,noreferrer",
    );
    return true;
  },
});
function Editor({ value, onChange, lang = "yaml", readonly = false, onField }) {
  const el = useRef(),
    view = useRef(),
    change = useRef(onChange),
    field = useRef(onField);
  change.current = onChange;
  field.current = onField;
  useEffect(() => {
    const v = new EditorView({
      doc: value,
      extensions: [
        basicSetup,
        lang === "js" ? javascript() : yaml(),
        ...(lang === "yaml" ? [fieldHover, fieldClick] : []),
        EditorView.editable.of(!readonly),
        EditorView.lineWrapping,
        EditorView.updateListener.of((u) => {
          if (u.docChanged) change.current?.(u.state.doc.toString());
          if (u.selectionSet || u.docChanged) {
            const line = u.state.doc.lineAt(u.state.selection.main.head).text;
            const m = line.match(/^\s*(?:-\s*)?([\w-]+)\s*:/);
            if (m) field.current?.(m[1]);
          }
        }),
      ],
      parent: el.current,
    });
    view.current = v;
    return () => v.destroy();
  }, [lang, readonly]);
  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value)
      v.dispatch({
        changes: { from: 0, to: v.state.doc.length, insert: value },
      });
  }, [value]);
  return <div className="editor" ref={el} />;
}
function merge(a, b) {
  if (!b || typeof b !== "object" || Array.isArray(b)) return b;
  const out = { ...(a && typeof a === "object" && !Array.isArray(a) ? a : {}) };
  for (const k of Object.keys(b)) {
    if (["__proto__", "constructor", "prototype"].includes(k))
      throw Error("不支持的字段名：" + k);
    out[k] = merge(out[k], b[k]);
  }
  return out;
}
function runScript(config, code) {
  return new Promise((resolve, reject) => {
    const blob = new Blob(
      [
        `onmessage = e => { try { const fn = new Function('config', e.data.code + '\\n; if (typeof main !== "function") throw new Error("请定义 main(config) 函数"); return main(config);'); Promise.resolve(fn(e.data.config)).then(result => postMessage({result}), error => postMessage({error:String(error)})); } catch(error) { postMessage({error:String(error)}); } }`,
      ],
      { type: "text/javascript" },
    );
    const url = URL.createObjectURL(blob),
      w = new Worker(url);
    const timer = setTimeout(() => {
      w.terminate();
      URL.revokeObjectURL(url);
      reject(Error("脚本执行超时（1 秒）"));
    }, 1000);
    w.onmessage = (e) => {
      clearTimeout(timer);
      w.terminate();
      URL.revokeObjectURL(url);
      e.data.error ? reject(Error(e.data.error)) : resolve(e.data.result);
    };
    w.onerror = (e) => {
      clearTimeout(timer);
      w.terminate();
      URL.revokeObjectURL(url);
      reject(Error(e.message));
    };
    w.postMessage({ config, code });
  });
}
function App() {
  const [source, setSource] = useState(""),
    [steps, setSteps] = useState([]),
    [active, setActive] = useState(null),
    [result, setResult] = useState(""),
    [error, setError] = useState(""),
    [url, setUrl] = useState(""),
    [loading, setLoading] = useState(false),
    [field, setField] = useState("mixed-port"),
    [copied, setCopied] = useState(false);
  const file = useRef();
  const selected = steps.find((s) => s.id === active);
  useEffect(() => {
    let canceled = false;
    const timer = setTimeout(async () => {
      try {
        if (!source.trim()) {
          if (!canceled) {
            setResult("");
            setError("");
          }
          return;
        }
        let obj = YAML.load(source);
        if (!obj || typeof obj !== "object" || Array.isArray(obj))
          throw Error("原始配置必须是 YAML 对象");
        for (const [i, s] of steps.entries()) {
          if (!s.enabled) continue;
          try {
            if (s.type === "override") {
              const patch = YAML.load(s.content);
              if (!patch || typeof patch !== "object" || Array.isArray(patch))
                throw Error("覆盖内容必须是 YAML 对象");
              obj = merge(obj, patch);
            } else {
              obj = await runScript(obj, s.content);
              if (!obj || typeof obj !== "object" || Array.isArray(obj))
                throw Error("main 必须返回配置对象");
            }
          } catch (e) {
            throw Error(`步骤 ${i + 1}：${e.message}`);
          }
        }
        if (!canceled) {
          setResult(YAML.dump(obj, { lineWidth: 120, noRefs: true }));
          setError("");
        }
      } catch (e) {
        if (!canceled) {
          setError(e.message);
          setResult("");
        }
      }
    }, 250);
    return () => {
      canceled = true;
      clearTimeout(timer);
    };
  }, [source, steps]);
  function update(p) {
    setSteps(steps.map((s) => (s.id === active ? { ...s, ...p } : s)));
  }
  function add(type, template) {
    const id = Date.now();
    setSteps([
      ...steps,
      {
        id,
        type,
        name:
          type === "override"
            ? template === "dns"
              ? "DNS 覆写"
              : "覆盖字段"
            : "JavaScript 脚本",
        enabled: true,
        content:
          type === "override"
            ? template === "dns"
              ? dnsTemplate
              : "# 在此填写需要覆盖的 YAML 字段\n"
            : "function main(config) {\n  return config;\n}",
      },
    ]);
    setActive(id);
  }
  function move(i, d) {
    const n = i + d;
    if (n < 0 || n >= steps.length) return;
    const a = [...steps];
    [a[i], a[n]] = [a[n], a[i]];
    setSteps(a);
  }
  async function loadUrl() {
    if (!url) return;
    setLoading(true);
    try {
      const r = await fetch(url);
      if (!r.ok) throw Error(`HTTP ${r.status}`);
      setSource(await r.text());
    } catch (e) {
      setError(
        "URL 加载失败：" +
          e.message +
          "。请检查地址及服务器 CORS 设置，或下载后导入文件。",
      );
    } finally {
      setLoading(false);
    }
  }
  function download() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([result], { type: "text/yaml" }));
    a.download = "mihomo-config.yaml";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  return (
    <>
      <header>
        <div className="brand">
          <span className="logo">
            <Layers2 size={19} />
          </span>
          <span>Mihomo 启动</span>
        </div>
        <div className="header-right">
          <a
            href="https://wiki.metacubex.one/config/"
            target="_blank"
            rel="noreferrer"
          >
            配置文档 <ExternalLink size={13} />
          </a>
        </div>
      </header>
      <main>
        <div className="toolbar">
          <div className="source-label">
            <div>
              <strong>导入配置</strong>
              <small>从 URL 或本地文件开始</small>
            </div>
          </div>
          <div className="urlbox">
            <Link size={16} />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadUrl()}
              placeholder="https://example.com/config.yaml"
            />
            <button onClick={loadUrl} disabled={loading}>
              {loading ? "加载中…" : "加载 URL"}
            </button>
          </div>
          <input
            ref={file}
            type="file"
            accept=".yaml,.yml,.txt"
            hidden
            onChange={async (e) => {
              if (e.target.files[0]) setSource(await e.target.files[0].text());
              e.target.value = "";
            }}
          />
          <button className="outline" onClick={() => file.current.click()}>
            <Upload size={15} /> 导入文件
          </button>
        </div>
        <div className="workspace">
          <section className="panel source">
            <div className="panel-head">
              <div>
                <strong>原始配置</strong>
              </div>
            </div>
            <Editor value={source} onChange={setSource} onField={setField} />
          </section>
          <section className="panel chain">
            <div className="panel-head">
              <div>
                <strong>操作链</strong>
              </div>
            </div>
            <div className="chain-body">
              <div className="steps">
                {steps.map((s, i) => (
                  <div
                    key={s.id}
                    className={"step " + (active === s.id ? "selected" : "")}
                    onClick={() => setActive(s.id)}
                  >
                    <span
                      className={
                        "step-icon " + (s.type === "script" ? "purple" : "")
                      }
                    >
                      {s.type === "script" ? (
                        <Braces size={16} />
                      ) : (
                        <Layers2 size={16} />
                      )}
                    </span>
                    <div className="step-title">
                      <input
                        aria-label="操作名称"
                        value={
                          s.name ??
                          (s.type === "override"
                            ? "覆盖字段"
                            : "JavaScript 脚本")
                        }
                        onClick={(e) => e.stopPropagation()}
                        onFocus={() => setActive(s.id)}
                        onChange={(e) =>
                          setSteps(
                            steps.map((x) =>
                              x.id === s.id
                                ? { ...x, name: e.target.value }
                                : x,
                            ),
                          )
                        }
                      />
                    </div>
                    <label
                      className="toggle"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={s.enabled}
                        onChange={() =>
                          setSteps(
                            steps.map((x) =>
                              x.id === s.id ? { ...x, enabled: !x.enabled } : x,
                            ),
                          )
                        }
                      />
                      <span />
                    </label>
                    <div className="step-actions">
                      <button
                        title="上移"
                        onClick={(e) => {
                          e.stopPropagation();
                          move(i, -1);
                        }}
                        disabled={!i}
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        title="下移"
                        onClick={(e) => {
                          e.stopPropagation();
                          move(i, 1);
                        }}
                        disabled={i === steps.length - 1}
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        title="删除"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSteps(steps.filter((x) => x.id !== s.id));
                          if (active === s.id)
                            setActive(steps.find((x) => x.id !== s.id)?.id);
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="add-row">
                <select
                  aria-label="新建覆盖字段"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) add("override", e.target.value);
                  }}
                >
                  <option value="" disabled>
                    ＋ 覆盖字段
                  </option>
                  <option value="dns">DNS 覆写</option>
                  <option value="custom">自定义</option>
                </select>
                <button onClick={() => add("script")}>
                  <Plus size={14} /> JS 脚本
                </button>
              </div>
              {selected ? (
                <div className="step-editor">
                  <Editor
                    key={selected.id}
                    value={selected.content}
                    onChange={(content) => update({ content })}
                    lang={selected.type === "script" ? "js" : "yaml"}
                    onField={setField}
                  />
                </div>
              ) : (
                <div className="empty">添加一个步骤，开始转换配置。</div>
              )}
            </div>
          </section>
          <section className="panel output">
            <div className="panel-head">
              <div>
                <strong>配置成品</strong>
              </div>
            </div>
            {error ? (
              <div className="error">
                <AlertCircle size={17} />
                <div>
                  <strong>无法生成配置</strong>
                  <p>{error}</p>
                </div>
              </div>
            ) : (
              <Editor value={result} readonly onField={setField} />
            )}
            <div className="output-actions">
              <button
                className="outline"
                disabled={!result}
                onClick={async () => {
                  await navigator.clipboard.writeText(result);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}{" "}
                {copied ? "已复制" : "复制"}
              </button>
              <button className="primary" disabled={!result} onClick={download}>
                <Download size={15} /> 下载 YAML
              </button>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
