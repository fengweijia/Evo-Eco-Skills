#!/usr/bin/env python3
"""
rednote002 - 短视频平台数据爬取脚本
用于rednote002的对标账号分析功能
"""

import asyncio
import json
import sys
import argparse
from typing import Optional, List, Dict

# 尝试导入爬虫库
try:
    from douyin_tiktok_scraper import DouyinScraper
    SCRAPER_AVAILABLE = True
except ImportError:
    SCRAPER_AVAILABLE = False
    print("警告: douyin-tiktok-scraper 未安装")
    print("安装命令: pip install douyin-tiktok-scraper")


class ShortVideoScraper:
    """短视频平台数据爬取封装"""
    
    def __init__(self):
        if not SCRAPER_AVAILABLE:
            raise RuntimeError("请先安装: pip install douyin-tiktok-scraper")
        self.scraper = DouyinScraper()
    
    async def search_users(self, keyword: str, limit: int = 20) -> List[Dict]:
        """搜索用户"""
        try:
            results = await self.scraper.search_user(keyword=keyword, limit=limit)
            users = []
            for item in results:
                users.append({
                    'id': item.get('sec_user_id', ''),
                    'nickname': item.get('nickname', ''),
                    'avatar': item.get('avatar_url', ''),
                    'signature': item.get('signature', ''),
                    'followers': item.get('follower_count', 0),
                    'following': item.get('following_count', 0),
                    'likes': item.get('total_likes', 0)
                })
            return users
        except Exception as e:
            print(f"搜索用户出错: {e}")
            return []
    
    async def get_user_info(self, sec_user_id: str) -> Optional[Dict]:
        """获取用户详细信息"""
        try:
            info = await self.scraper.get_user_info(sec_user_id=sec_user_id)
            return {
                'nickname': info.get('nickname', ''),
                'avatar': info.get('avatar_url', ''),
                'signature': info.get('signature', ''),
                'followers': info.get('follower_count', 0),
                'following': info.get('following_count', 0),
                'posts': info.get('total_favorited', 0),
                'likes': info.get('total_likes', 0),
                'verified': info.get('verified', False),
                'verified_reason': info.get('verified_reason', '')
            }
        except Exception as e:
            print(f"获取用户信息出错: {e}")
            return None
    
    async def get_user_posts(self, sec_user_id: str, limit: int = 10) -> List[Dict]:
        """获取用户发布的视频"""
        try:
            posts = await self.scraper.get_user_posts(sec_user_id=sec_user_id, limit=limit)
            results = []
            for post in posts:
                results.append({
                    'id': post.get('aweme_id', ''),
                    'desc': post.get('desc', ''),
                    'create_time': post.get('create_time', ''),
                    'digg_count': post.get('statistics', {}).get('digg_count', 0),
                    'play_count': post.get('statistics', {}).get('play_count', 0),
                    'share_count': post.get('statistics', {}).get('share_count', 0),
                    'comment_count': post.get('statistics', {}).get('comment_count', 0),
                    'collect_count': post.get('statistics', {}).get('collect_count', 0)
                })
            return results
        except Exception as e:
            print(f"获取用户帖子出错: {e}")
            return []
    
    async def parse_video(self, url: str) -> Optional[Dict]:
        """解析视频链接"""
        try:
            result = await self.scraper.hybrid_parsing(url)
            return {
                'title': result.get('desc', ''),
                'author': result.get('author', {}).get('nickname', ''),
                'digg_count': result.get('statistics', {}).get('digg_count', 0),
                'play_count': result.get('statistics', {}).get('play_count', 0),
                'video_url': result.get('video', {}).get('play_addr', {}).get('url_list', [''])[0]
            }
        except Exception as e:
            print(f"解析视频出错: {e}")
            return None


async def main():
    parser = argparse.ArgumentParser(description='短视频数据爬取工具')
    parser.add_argument('action', choices=['search', 'user', 'posts', 'parse'],
                        help='操作类型')
    parser.add_argument('--keyword', '-k', help='搜索关键词')
    parser.add_argument('--user_id', '-u', help='用户ID')
    parser.add_argument('--url', help='视频URL')
    parser.add_argument('--limit', '-l', type=int, default=10, help='数量限制')
    
    args = parser.parse_args()
    
    try:
        scraper = ShortVideoScraper()
        
        if args.action == 'search':
            if not args.keyword:
                print("错误: search需要 --keyword 参数")
                sys.exit(1)
            results = await scraper.search_users(args.keyword, args.limit)
            print(json.dumps(results, ensure_ascii=False, indent=2))
            
        elif args.action == 'user':
            if not args.user_id:
                print("错误: user需要 --user_id 参数")
                sys.exit(1)
            result = await scraper.get_user_info(args.user_id)
            print(json.dumps(result, ensure_ascii=False, indent=2) if result else "{}")
            
        elif args.action == 'posts':
            if not args.user_id:
                print("错误: posts需要 --user_id 参数")
                sys.exit(1)
            results = await scraper.get_user_posts(args.user_id, args.limit)
            print(json.dumps(results, ensure_ascii=False, indent=2))
            
        elif args.action == 'parse':
            if not args.url:
                print("错误: parse需要 --url 参数")
                sys.exit(1)
            result = await scraper.parse_video(args.url)
            print(json.dumps(result, ensure_ascii=False, indent=2) if result else "{}")
            
    except Exception as e:
        print(f"错误: {e}")
        sys.exit(1)


if __name__ == '__main__':
    asyncio.run(main())