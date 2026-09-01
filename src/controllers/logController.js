const fs = require("fs/promises");
const path = require("path");
const logger = require("../log/logger");
const { success } = require("../config/response");
const { asyncHandler } = require("../utils/asyncHandler");
const { appError } = require("../middleware/errorHandler");

const HEARTBEAT_MS = 25000;

const logs = {
    recent: asyncHandler(async (req, res) => {
        const entries = logger.recent({
            level: req.query.level,
            event: req.query.event,
            search: req.query.search,
            limit: req.query.limit ? Number(req.query.limit) : 200,
        });

        return success(res, { entries, total: entries.length, logDir: logger.logDir });
    }),

    files: asyncHandler(async (req, res) => {
        let names = [];
        try {
            names = await fs.readdir(logger.logDir);
        } catch {
            return success(res, { files: [], logDir: logger.logDir });
        }

        const files = [];
        for (const name of names) {
            if (!name.endsWith(".log") && !name.endsWith(".gz")) continue;
            const stat = await fs.stat(path.join(logger.logDir, name));
            files.push({ name, bytes: stat.size, modifiedAt: stat.mtime });
        }

        files.sort((a, b) => (a.name < b.name ? 1 : -1));
        return success(res, { files, logDir: logger.logDir });
    }),

    download: asyncHandler(async (req, res) => {
        const name = path.basename(req.params.name);
        if (!name.endsWith(".log")) {
            throw appError(400, "unsupported_file", "Only .log files can be read");
        }

        const target = path.join(logger.logDir, name);
        let content;
        try {
            content = await fs.readFile(target, "utf8");
        } catch {
            throw appError(404, "log_not_found", "That log file does not exist");
        }

        const lines = content.trim().split("\n").filter(Boolean);
        const tail = lines.slice(-500).map((line) => {
            try {
                return JSON.parse(line);
            } catch {
                return { message: line };
            }
        });

        return success(res, { name, lines: tail, truncated: lines.length > 500 });
    }),

    stream: (req, res) => {
        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
        });

        res.write("retry: 3000\n\n");

        for (const entry of logger.recent({ limit: 50 })) {
            res.write(`data: ${JSON.stringify(entry)}\n\n`);
        }

        const unsubscribe = logger.subscribe((entry) => {
            res.write(`data: ${JSON.stringify(entry)}\n\n`);
        });

        const heartbeat = setInterval(() => res.write(": ping\n\n"), HEARTBEAT_MS);

        req.on("close", () => {
            clearInterval(heartbeat);
            unsubscribe();
            res.end();
        });
    },
};

module.exports = { logs };
