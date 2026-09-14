import os
import gc
import ctypes
from typing import Dict, Any

def get_process_memory_mb() -> float:
    """Returns exact current process Resident Set Size (VmRSS) in MB."""
    # 1. Read live VmRSS from Linux /proc/self/status
    try:
        with open("/proc/self/status", "r") as f:
            for line in f:
                if line.startswith("VmRSS:"):
                    # Format: VmRSS:     12345 kB
                    parts = line.split()
                    return round(float(parts[1]) / 1024.0, 2)
    except Exception:
        pass

    # 2. Fallback: /proc/self/statm
    try:
        with open("/proc/self/statm", "r") as f:
            fields = f.read().split()
            rss_pages = int(fields[1])
            page_size = os.sysconf("SC_PAGE_SIZE")
            return round((rss_pages * page_size) / (1024.0 * 1024.0), 2)
    except Exception:
        pass

    # 3. Fallback: getrusage peak
    try:
        import resource
        usage_kb = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
        return round(usage_kb / 1024.0, 2)
    except Exception:
        return 0.0

def trim_memory() -> Dict[str, Any]:
    """
    Forces full Python garbage collection and instructs the glibc memory allocator
    to release all unused heap memory pages back to the Linux OS kernel.
    Essential for 512MB RAM cloud tiers (Render / Railway / Fly.io).
    """
    before_mb = get_process_memory_mb()
    
    # 1. Run Python Garbage Collector across all 3 generations
    gc.collect(2)
    gc.collect(1)
    gc.collect(0)
    
    # 2. Instruct glibc malloc to release freed memory back to OS
    trimmed = False
    try:
        libc = ctypes.CDLL("libc.so.6")
        if hasattr(libc, "malloc_trim"):
            libc.malloc_trim(0)
            trimmed = True
    except Exception:
        pass
    
    after_mb = get_process_memory_mb()
    
    return {
        "before_mb": before_mb,
        "after_mb": after_mb,
        "malloc_trimmed": trimmed
    }
